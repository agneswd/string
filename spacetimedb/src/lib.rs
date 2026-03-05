// String — Discord-like chat app built on SpacetimeDB
// Manager/wiring module: types, tables, helpers, reducers

pub mod types;
pub use types::{ChannelType, MemberRole, RtcSignalType, UserStatus};

pub mod tables;
pub use tables::{
    Channel, DmCallRequest, Guild, GuildInvite, GuildMember, Message, PresenceOfflineJob,
    PresenceState, RtcSignal, User, UserPresence, VoiceState,
};
pub mod helpers;
pub mod reducers;

use crate::tables::{
    dm_call_request, presence_offline_job, presence_state, rtc_signal, user, user_presence,
    voice_state,
};
use spacetimedb::{Identity, ReducerContext, ScheduleAt, Table};
use std::time::Duration;

// Keep a short grace window so transient disconnects/reconnects don't flap users offline
// or eagerly purge ephemeral signaling/call state.
const PRESENCE_OFFLINE_GRACE_MS: u64 = 1_500;

pub(crate) fn restore_status_after_reconnect(
    current_status: &UserStatus,
    last_non_offline_status: Option<&UserStatus>,
) -> Option<UserStatus> {
    if *current_status != UserStatus::Offline {
        return None;
    }

    last_non_offline_status.cloned()
}

pub(crate) fn snapshot_status_before_disconnect(current_status: &UserStatus) -> Option<UserStatus> {
    if *current_status == UserStatus::Offline {
        return None;
    }

    Some(current_status.clone())
}

pub(crate) fn should_apply_offline_transition(
    online_session_count: u32,
    state_generation: u64,
    expected_generation: u64,
) -> bool {
    online_session_count == 0 && state_generation == expected_generation
}

pub(crate) fn should_update_user_status_transition(
    current_status: &UserStatus,
    next_status: &UserStatus,
) -> bool {
    current_status != next_status
}

pub(crate) fn status_after_login_identity_transfer(
    current_status: &UserStatus,
    new_identity_status_before_disconnect: Option<&UserStatus>,
    old_identity_status_before_disconnect: Option<&UserStatus>,
) -> Option<UserStatus> {
    if *current_status != UserStatus::Offline {
        return None;
    }

    new_identity_status_before_disconnect
        .cloned()
        .or_else(|| old_identity_status_before_disconnect.cloned())
        .or(Some(UserStatus::Online))
}

pub(crate) fn cancel_offline_jobs_for(ctx: &ReducerContext, who: Identity) -> usize {
    let pending_job_ids: Vec<u64> = ctx
        .db
        .presence_offline_job()
        .presence_offline_job_by_identity()
        .filter(&who)
        .map(|row| row.scheduled_id)
        .collect();
    let canceled_count = pending_job_ids.len();
    for scheduled_id in pending_job_ids {
        ctx.db
            .presence_offline_job()
            .scheduled_id()
            .delete(scheduled_id);
    }

    canceled_count
}

pub(crate) fn upsert_user_presence(ctx: &ReducerContext, who: Identity, status: UserStatus) {
    let presence_row = UserPresence {
        identity: who,
        status,
        changed_at: ctx.timestamp,
    };

    if ctx.db.user_presence().identity().find(who).is_some() {
        ctx.db.user_presence().identity().update(presence_row);
    } else {
        ctx.db.user_presence().insert(presence_row);
    }
}

pub(crate) fn update_user_status_if_changed(
    ctx: &ReducerContext,
    user: &mut User,
    next_status: UserStatus,
) {
    if !should_update_user_status_transition(&user.status, &next_status) {
        return;
    }

    user.status = next_status.clone();
    ctx.db.user().identity().update(user.clone());
    upsert_user_presence(ctx, user.identity, next_status);
}

fn cleanup_ephemeral_presence(ctx: &ReducerContext, who: Identity) {
    ctx.db.voice_state().identity().delete(who);

    let caller_call_ids: Vec<u64> = ctx
        .db
        .dm_call_request()
        .caller_identity()
        .filter(&who)
        .map(|row| row.call_id)
        .collect();
    for call_id in caller_call_ids {
        ctx.db.dm_call_request().call_id().delete(call_id);
    }

    let callee_call_ids: Vec<u64> = ctx
        .db
        .dm_call_request()
        .callee_identity()
        .filter(&who)
        .map(|row| row.call_id)
        .collect();
    for call_id in callee_call_ids {
        ctx.db.dm_call_request().call_id().delete(call_id);
    }

    let incoming_signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .recipient_identity()
        .filter(&who)
        .map(|row| row.signal_id)
        .collect();
    for signal_id in incoming_signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }

    let outgoing_signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .sender_identity()
        .filter(&who)
        .map(|row| row.signal_id)
        .collect();
    for signal_id in outgoing_signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }
}

// ─────────────────────────────────────────────
// Lifecycle Reducers
// ─────────────────────────────────────────────

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("String module initialized");
}

/// Called on every new client connection.
/// If the user has not registered yet, they get a placeholder profile
/// so they show up as "online" before calling `register_user`.
#[spacetimedb::reducer(client_connected)]
pub fn client_connected(ctx: &ReducerContext) {
    let who = ctx.sender();

    let _ = cancel_offline_jobs_for(ctx, who);

    let existing_state = ctx.db.presence_state().identity().find(who);
    let mut state = existing_state.clone().unwrap_or(PresenceState {
        identity: who,
        online_session_count: 0,
        status_before_disconnect: None,
        generation: 0,
    });
    state.online_session_count = state.online_session_count.saturating_add(1);
    state.generation = state.generation.wrapping_add(1);

    if existing_state.is_some() {
        ctx.db.presence_state().identity().update(state.clone());
    } else {
        ctx.db.presence_state().insert(state.clone());
    }

    if let Some(mut user) = ctx.db.user().identity().find(who) {
        if let Some(restored_status) =
            restore_status_after_reconnect(&user.status, state.status_before_disconnect.as_ref())
        {
            update_user_status_if_changed(ctx, &mut user, restored_status);

            state.status_before_disconnect = None;
            ctx.db.presence_state().identity().update(state.clone());
        }
    }

    log::info!("Client connected: {}", who.to_abbreviated_hex());
}

/// Called when a client disconnects (including crashes/timeouts).
#[spacetimedb::reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    let who = ctx.sender();

    let existing_state = ctx.db.presence_state().identity().find(who);
    let mut state = existing_state.clone().unwrap_or(PresenceState {
        identity: who,
        online_session_count: 0,
        status_before_disconnect: None,
        generation: 0,
    });

    if state.online_session_count > 0 {
        state.online_session_count -= 1;
    }
    state.generation = state.generation.wrapping_add(1);

    if state.online_session_count == 0 {
        state.status_before_disconnect = ctx
            .db
            .user()
            .identity()
            .find(who)
            .and_then(|user| snapshot_status_before_disconnect(&user.status));

        let transition_at = ctx.timestamp + Duration::from_millis(PRESENCE_OFFLINE_GRACE_MS);
        ctx.db.presence_offline_job().insert(PresenceOfflineJob {
            scheduled_id: 0,
            scheduled_at: ScheduleAt::Time(transition_at),
            identity: who,
            expected_generation: state.generation,
        });
    }

    if existing_state.is_some() {
        ctx.db.presence_state().identity().update(state.clone());
    } else {
        ctx.db.presence_state().insert(state.clone());
    }

    log::info!(
        "Client disconnected: {} (sessions={}, generation={})",
        who.to_abbreviated_hex(),
        state.online_session_count,
        state.generation,
    );
}

#[spacetimedb::reducer]
pub fn presence_offline_job_due(ctx: &ReducerContext, job: PresenceOfflineJob) {
    let who = job.identity;

    let Some(state) = ctx.db.presence_state().identity().find(who) else {
        return;
    };

    if !should_apply_offline_transition(
        state.online_session_count,
        state.generation,
        job.expected_generation,
    ) {
        return;
    }

    let Some(mut user) = ctx.db.user().identity().find(who) else {
        log::warn!(
            "Presence offline transition skipped (missing user row): {}",
            who.to_abbreviated_hex()
        );
        return;
    };

    if user.status != UserStatus::Offline {
        update_user_status_if_changed(ctx, &mut user, UserStatus::Offline);
    }

    cleanup_ephemeral_presence(ctx, who);

    log::info!(
        "Presence offline transition applied: {}",
        who.to_abbreviated_hex()
    );
}

#[cfg(test)]
mod presence_tests;
