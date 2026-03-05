use crate::tables::{
    dm_call_event as _, dm_call_event__view as _, dm_call_request as _, dm_channel as _,
    dm_participant as _, dm_participant__view as _, user as _, voice_state as _, DmCallEvent,
    DmCallRequest, VoiceState,
};
use spacetimedb::{reducer, Identity, ReducerContext, Table, ViewContext};

const DM_CALL_EVENT_STARTED: &str = "started";
const DM_CALL_EVENT_MISSED: &str = "missed";
const DM_CALL_EVENT_CANCELED: &str = "canceled";

fn decline_event_type_for_actor(is_callee: bool) -> &'static str {
    if is_callee {
        DM_CALL_EVENT_MISSED
    } else {
        DM_CALL_EVENT_CANCELED
    }
}

fn my_dm_channel_ids(ctx: &ViewContext, identity: &Identity) -> std::collections::BTreeSet<u64> {
    ctx.db
        .dm_participant()
        .dm_participant_by_identity()
        .filter(identity)
        .map(|participant| participant.dm_channel_id)
        .collect()
}

#[reducer]
pub fn initiate_dm_call(ctx: &ReducerContext, dm_channel_id: u64) -> Result<(), String> {
    // Verify user registered
    ctx.db
        .user()
        .identity()
        .find(ctx.sender())
        .ok_or("Not registered")?;

    // Verify DM channel exists
    ctx.db
        .dm_channel()
        .dm_channel_id()
        .find(dm_channel_id)
        .ok_or("DM channel not found")?;

    // Verify caller is a participant
    let participants: Vec<Identity> = ctx
        .db
        .dm_participant()
        .iter()
        .filter(|p| p.dm_channel_id == dm_channel_id)
        .map(|p| p.identity)
        .collect();

    if !participants.contains(&ctx.sender()) {
        return Err("Not a participant of this DM channel".into());
    }

    // Find the other participant (callee)
    let callee = *participants
        .iter()
        .find(|&&id| id != ctx.sender())
        .ok_or("No other participant found")?;

    // Check no pending call exists for this channel from this caller
    let existing = ctx
        .db
        .dm_call_request()
        .caller_identity()
        .filter(&ctx.sender())
        .any(|r| r.dm_channel_id == dm_channel_id);
    if existing {
        return Err("You already have a pending call for this channel".into());
    }

    // Also check if callee already has a pending call to us
    let reverse = ctx
        .db
        .dm_call_request()
        .caller_identity()
        .filter(&callee)
        .any(|r| r.dm_channel_id == dm_channel_id);
    if reverse {
        return Err("The other person is already calling you".into());
    }

    // If caller is already in a voice call for a different channel, reject
    if let Some(caller_vs) = ctx.db.voice_state().identity().find(ctx.sender()) {
        if !(caller_vs.guild_id == 0 && caller_vs.channel_id == dm_channel_id) {
            return Err("You are already in a voice call".into());
        }
    }

    // If callee is already in a voice call for a different channel, reject
    if let Some(callee_vs) = ctx.db.voice_state().identity().find(callee) {
        if !(callee_vs.guild_id == 0 && callee_vs.channel_id == dm_channel_id) {
            return Err("The other person is already in a voice call".into());
        }
    }

    ctx.db.dm_call_request().insert(DmCallRequest {
        call_id: 0,
        dm_channel_id,
        caller_identity: ctx.sender(),
        callee_identity: callee,
        created_at: ctx.timestamp,
    });

    Ok(())
}

#[reducer]
pub fn accept_dm_call(ctx: &ReducerContext, call_id: u64) -> Result<(), String> {
    let call = ctx
        .db
        .dm_call_request()
        .call_id()
        .find(call_id)
        .ok_or("Call not found")?;

    if call.callee_identity != ctx.sender() {
        return Err("This call is not for you".into());
    }

    let dm_channel_id = call.dm_channel_id;
    let caller = call.caller_identity;

    // Delete the call request
    ctx.db.dm_call_request().call_id().delete(call_id);

    // Clean up any existing voice states for both parties
    if ctx.db.voice_state().identity().find(ctx.sender()).is_some() {
        ctx.db.voice_state().identity().delete(ctx.sender());
    }
    if ctx.db.voice_state().identity().find(caller).is_some() {
        ctx.db.voice_state().identity().delete(caller);
    }

    // Create voice states for both
    ctx.db.voice_state().insert(VoiceState {
        identity: caller,
        guild_id: 0,
        channel_id: dm_channel_id,
        is_muted: false,
        is_deafened: false,
        is_streaming: false,
        joined_at: ctx.timestamp,
    });

    ctx.db.voice_state().insert(VoiceState {
        identity: ctx.sender(),
        guild_id: 0,
        channel_id: dm_channel_id,
        is_muted: false,
        is_deafened: false,
        is_streaming: false,
        joined_at: ctx.timestamp,
    });

    ctx.db.dm_call_event().insert(DmCallEvent {
        event_id: 0,
        dm_channel_id,
        actor_identity: ctx.sender(),
        event_type: DM_CALL_EVENT_STARTED.to_string(),
        created_at: ctx.timestamp,
        duration_seconds: None,
    });

    Ok(())
}

#[reducer]
pub fn decline_dm_call(ctx: &ReducerContext, call_id: u64) -> Result<(), String> {
    let call = ctx
        .db
        .dm_call_request()
        .call_id()
        .find(call_id)
        .ok_or("Call not found")?;

    // Either the caller (cancel) or callee (decline/missed) can remove the request
    if call.callee_identity != ctx.sender() && call.caller_identity != ctx.sender() {
        return Err("Not your call".into());
    }

    let is_callee = call.callee_identity == ctx.sender();
    ctx.db.dm_call_event().insert(DmCallEvent {
        event_id: 0,
        dm_channel_id: call.dm_channel_id,
        actor_identity: ctx.sender(),
        event_type: decline_event_type_for_actor(is_callee).to_string(),
        created_at: ctx.timestamp,
        duration_seconds: None,
    });

    ctx.db.dm_call_request().call_id().delete(call_id);
    Ok(())
}

#[spacetimedb::view(accessor = my_dm_call_events, public)]
pub fn my_dm_call_events(ctx: &ViewContext) -> Vec<DmCallEvent> {
    let who = ctx.sender();
    let mut events = Vec::new();

    for dm_channel_id in my_dm_channel_ids(ctx, &who) {
        events.extend(
            ctx.db
                .dm_call_event()
                .dm_call_event_by_dm_channel_id()
                .filter(dm_channel_id),
        );
    }

    events
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decline_event_is_missed_when_callee_declines() {
        assert_eq!(decline_event_type_for_actor(true), "missed");
    }

    #[test]
    fn decline_event_is_canceled_when_caller_cancels() {
        assert_eq!(decline_event_type_for_actor(false), "canceled");
    }
}
