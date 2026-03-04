// String — Discord-like chat app built on SpacetimeDB
// Manager/wiring module: types, tables, helpers, reducers

pub mod types;
pub use types::{ChannelType, MemberRole, RtcSignalType, UserStatus};

pub mod tables;
pub use tables::{
    Channel, DmCallRequest, Guild, GuildInvite, GuildMember, Message, RtcSignal, User, VoiceState,
};
pub mod helpers;
pub mod reducers;

use crate::tables::{dm_call_request, rtc_signal, user, voice_state};
use spacetimedb::ReducerContext;

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
    if let Some(mut user) = ctx.db.user().identity().find(who) {
        user.status = UserStatus::Online;
        ctx.db.user().identity().update(user);
    }
    log::info!("Client connected: {}", who.to_abbreviated_hex());
}

/// Called when a client disconnects (including crashes/timeouts).
#[spacetimedb::reducer(client_disconnected)]
pub fn client_disconnected(ctx: &ReducerContext) {
    let who = ctx.sender();

    if let Some(mut user) = ctx.db.user().identity().find(who) {
        user.status = UserStatus::Offline;
        ctx.db.user().identity().update(user);
    }

    ctx.db.voice_state().identity().delete(who);

    // Clean up any pending DM call requests (as caller or callee)
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

    log::info!("Client disconnected: {}", who.to_abbreviated_hex());
}
