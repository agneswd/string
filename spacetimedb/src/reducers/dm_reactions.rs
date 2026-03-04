use crate::tables::{
    dm_message as _, dm_participant as _, dm_reaction as _, DmReaction,
};
use super::reaction::normalize_and_validate_emoji;
use spacetimedb::{ReducerContext, Table};

fn require_dm_participant(ctx: &ReducerContext, dm_channel_id: u64) -> Result<(), String> {
    let caller = ctx.sender();
    let is_participant = ctx
        .db
        .dm_participant()
        .dm_participant_by_dm_channel_id()
        .filter(dm_channel_id)
        .any(|p| p.identity == caller);
    if !is_participant {
        return Err("You are not a participant of this DM channel".into());
    }
    Ok(())
}

fn require_reactable_dm_message(ctx: &ReducerContext, dm_message_id: u64) -> Result<u64, String> {
    let msg = ctx
        .db
        .dm_message()
        .dm_message_id()
        .find(dm_message_id)
        .ok_or("DM message not found")?;

    if msg.is_deleted {
        return Err("Cannot react to a deleted message".into());
    }

    require_dm_participant(ctx, msg.dm_channel_id)?;
    Ok(msg.dm_channel_id)
}

fn find_matching_dm_reaction_ids(
    ctx: &ReducerContext,
    dm_message_id: u64,
    emoji: &str,
) -> Vec<u64> {
    let caller = ctx.sender();
    ctx.db
        .dm_reaction()
        .dm_reaction_by_dm_message_id()
        .filter(dm_message_id)
        .filter(|r| r.reactor_identity == caller && r.emoji == emoji)
        .map(|r| r.dm_reaction_id)
        .collect()
}

/// Add a reaction to a DM message.
#[spacetimedb::reducer]
pub fn add_dm_reaction(
    ctx: &ReducerContext,
    dm_message_id: u64,
    emoji: String,
) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    let dm_channel_id = require_reactable_dm_message(ctx, dm_message_id)?;

    if !find_matching_dm_reaction_ids(ctx, dm_message_id, &emoji).is_empty() {
        return Err("Reaction already exists".into());
    }

    ctx.db.dm_reaction().insert(DmReaction {
        dm_reaction_id: 0,
        dm_message_id,
        dm_channel_id,
        reactor_identity: ctx.sender(),
        emoji,
        reacted_at: ctx.timestamp,
    });

    Ok(())
}

/// Remove a reaction from a DM message.
#[spacetimedb::reducer]
pub fn remove_dm_reaction(
    ctx: &ReducerContext,
    dm_message_id: u64,
    emoji: String,
) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    require_reactable_dm_message(ctx, dm_message_id)?;

    let reaction_ids = find_matching_dm_reaction_ids(ctx, dm_message_id, &emoji);
    if reaction_ids.is_empty() {
        return Err("Reaction not found".into());
    }

    for reaction_id in reaction_ids {
        ctx.db.dm_reaction().dm_reaction_id().delete(reaction_id);
    }

    Ok(())
}

/// Toggle a reaction on a DM message (add if missing, remove if exists).
#[spacetimedb::reducer]
pub fn toggle_dm_reaction(
    ctx: &ReducerContext,
    dm_message_id: u64,
    emoji: String,
) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    let dm_channel_id = require_reactable_dm_message(ctx, dm_message_id)?;

    let reaction_ids = find_matching_dm_reaction_ids(ctx, dm_message_id, &emoji);
    if reaction_ids.is_empty() {
        ctx.db.dm_reaction().insert(DmReaction {
            dm_reaction_id: 0,
            dm_message_id,
            dm_channel_id,
            reactor_identity: ctx.sender(),
            emoji,
            reacted_at: ctx.timestamp,
        });
    } else {
        for reaction_id in reaction_ids {
            ctx.db.dm_reaction().dm_reaction_id().delete(reaction_id);
        }
    }

    Ok(())
}
