use crate::tables::{
    dm_channel as _, dm_channel__view as _, dm_message as _, dm_message__view as _,
    dm_participant as _, dm_participant__view as _, dm_typing as _, dm_typing__view as _,
    friend as _, DmChannel, DmMessage, DmParticipant, DmTyping,
};
use spacetimedb::{Identity, ReducerContext, Table, ViewContext};
use std::time::Duration;

const DM_TYPING_EXPIRY_MS: u64 = 3_500;

pub(super) fn dedup_participants_including_caller<T>(caller: T, participants: Vec<T>) -> Vec<T>
where
    T: Clone + PartialEq,
{
    let mut unique_participants = vec![caller.clone()];

    for participant in participants {
        if !unique_participants
            .iter()
            .any(|existing| existing == &participant)
        {
            unique_participants.push(participant);
        }
    }

    unique_participants
}

fn find_dm_participant(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    identity: &Identity,
) -> Option<DmParticipant> {
    ctx.db
        .dm_participant()
        .dm_participant_by_dm_channel_id()
        .filter(dm_channel_id)
        .find(|participant| &participant.identity == identity)
}

fn require_dm_participant(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    identity: &Identity,
) -> Result<DmParticipant, String> {
    find_dm_participant(ctx, dm_channel_id, identity)
        .ok_or_else(|| "You are not a participant in this DM channel".to_string())
}

fn dm_typing_key(dm_channel_id: u64, identity: &Identity) -> String {
    format!("dm:{}:{}", dm_channel_id, identity.to_hex().to_string())
}

fn validate_dm_read_cursor_advance(
    last_read_message_id: Option<u64>,
    next_read_message_id: u64,
) -> Result<(), String> {
    if let Some(last_read_message_id) = last_read_message_id {
        if next_read_message_id < last_read_message_id {
            return Err("Cannot move DM read cursor backwards".to_string());
        }
    }

    Ok(())
}

fn my_dm_channel_ids(ctx: &ViewContext, identity: &Identity) -> std::collections::BTreeSet<u64> {
    let channel_ids = ctx
        .db
        .dm_participant()
        .dm_participant_by_identity()
        .filter(identity)
        .map(|participant| participant.dm_channel_id);

    collect_valid_dm_channel_ids(channel_ids, |dm_channel_id| {
        ctx.db
            .dm_channel()
            .dm_channel_id()
            .find(dm_channel_id)
            .is_some()
    })
}

fn collect_valid_dm_channel_ids<I, F>(
    channel_ids: I,
    mut channel_exists: F,
) -> std::collections::BTreeSet<u64>
where
    I: IntoIterator<Item = u64>,
    F: FnMut(u64) -> bool,
{
    channel_ids
        .into_iter()
        .filter(|channel_id| channel_exists(*channel_id))
        .collect()
}

fn are_friends(ctx: &ReducerContext, sender: &Identity, target: &Identity) -> bool {
    ctx.db
        .friend()
        .friend_by_identity_low()
        .filter(sender)
        .any(|friend| &friend.identity_high == target)
        || ctx
            .db
            .friend()
            .friend_by_identity_high()
            .filter(sender)
            .any(|friend| &friend.identity_low == target)
}

/// Create a direct-message channel with the provided participants.
/// The caller is always included and participant identities are de-duplicated.
#[spacetimedb::reducer]
pub fn create_dm_channel(
    ctx: &ReducerContext,
    participants: Vec<Identity>,
    _title: Option<String>,
) -> Result<(), String> {
    let caller = ctx.sender();
    let unique_participants = dedup_participants_including_caller(caller, participants);

    for identity in unique_participants
        .iter()
        .filter(|identity| *identity != &caller)
    {
        if !are_friends(ctx, &caller, identity) {
            return Err("You can only create DMs with friends".into());
        }
    }

    let dm_channel = ctx.db.dm_channel().insert(DmChannel {
        dm_channel_id: 0,
        created_by_identity: caller,
        created_at: ctx.timestamp,
    });

    for identity in unique_participants {
        ctx.db.dm_participant().insert(DmParticipant {
            dm_participant_id: 0,
            dm_channel_id: dm_channel.dm_channel_id,
            identity,
            joined_at: ctx.timestamp,
            last_read_message_id: None,
        });
    }

    Ok(())
}

/// Mark the caller's DM read cursor for a channel.
#[spacetimedb::reducer]
pub fn mark_dm_read(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    message_id: u64,
) -> Result<(), String> {
    let caller = ctx.sender();
    let mut participant = require_dm_participant(ctx, dm_channel_id, &caller)?;

    validate_dm_read_cursor_advance(participant.last_read_message_id, message_id)?;
    participant.last_read_message_id = Some(message_id);

    ctx.db
        .dm_participant()
        .dm_participant_id()
        .update(participant);

    Ok(())
}

/// Leave a direct-message channel.
#[spacetimedb::reducer]
pub fn leave_dm_channel(ctx: &ReducerContext, dm_channel_id: u64) -> Result<(), String> {
    if ctx
        .db
        .dm_channel()
        .dm_channel_id()
        .find(dm_channel_id)
        .is_none()
    {
        return Err("DM channel not found".into());
    }

    let caller = ctx.sender();
    let participant = require_dm_participant(ctx, dm_channel_id, &caller)?;
    let typing_key = dm_typing_key(dm_channel_id, &caller);
    if ctx.db.dm_typing().typing_key().find(typing_key.clone()).is_some() {
        ctx.db.dm_typing().typing_key().delete(typing_key);
    }
    ctx.db
        .dm_participant()
        .dm_participant_id()
        .delete(participant.dm_participant_id);

    Ok(())
}

/// Send a message in a direct-message channel.
#[spacetimedb::reducer]
pub fn send_dm_message(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    content: String,
    reply_to: Option<u64>,
) -> Result<(), String> {
    let content = content.trim().to_string();
    if content.is_empty() {
        return Err("Message content cannot be empty".into());
    }
    if content.len() > 4000 {
        return Err("Message must be ≤ 4000 characters".into());
    }

    if ctx
        .db
        .dm_channel()
        .dm_channel_id()
        .find(dm_channel_id)
        .is_none()
    {
        return Err("DM channel not found".into());
    }

    let caller = ctx.sender();
    require_dm_participant(ctx, dm_channel_id, &caller)?;

    if let Some(ref_id) = reply_to {
        let ref_msg = ctx
            .db
            .dm_message()
            .dm_message_id()
            .find(ref_id)
            .ok_or("Referenced DM message not found")?;
        if ref_msg.dm_channel_id != dm_channel_id {
            return Err("Cannot reply to a message in a different DM channel".into());
        }
    }

    ctx.db.dm_message().insert(DmMessage {
        dm_message_id: 0,
        dm_channel_id,
        author_identity: caller,
        content,
        sent_at: ctx.timestamp,
        edited_at: None,
        is_deleted: false,
        reply_to,
    });

    let typing_key = dm_typing_key(dm_channel_id, &caller);
    if ctx.db.dm_typing().typing_key().find(typing_key.clone()).is_some() {
        ctx.db.dm_typing().typing_key().delete(typing_key);
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn set_dm_typing(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    is_typing: bool,
) -> Result<(), String> {
    let caller = ctx.sender();
    require_dm_participant(ctx, dm_channel_id, &caller)?;

    let typing_key = dm_typing_key(dm_channel_id, &caller);

    if !is_typing {
        if ctx.db.dm_typing().typing_key().find(typing_key.clone()).is_some() {
            ctx.db.dm_typing().typing_key().delete(typing_key);
        }
        return Ok(());
    }

    let expires_at = ctx.timestamp + Duration::from_millis(DM_TYPING_EXPIRY_MS);
    if let Some(mut row) = ctx.db.dm_typing().typing_key().find(typing_key.clone()) {
        row.expires_at = expires_at;
        ctx.db.dm_typing().typing_key().update(row);
    } else {
        ctx.db.dm_typing().insert(DmTyping {
            typing_key,
            dm_channel_id,
            identity: caller,
            expires_at,
        });
    }

    Ok(())
}

/// Edit a direct-message message.
#[spacetimedb::reducer]
pub fn edit_dm_message(
    ctx: &ReducerContext,
    dm_message_id: u64,
    new_content: String,
) -> Result<(), String> {
    let new_content = new_content.trim().to_string();
    if new_content.is_empty() || new_content.len() > 4000 {
        return Err("Edited content must be 1–4000 characters".into());
    }

    let mut msg = ctx
        .db
        .dm_message()
        .dm_message_id()
        .find(dm_message_id)
        .ok_or("DM message not found")?;

    let caller = ctx.sender();
    require_dm_participant(ctx, msg.dm_channel_id, &caller)?;
    if msg.author_identity != caller {
        return Err("Only the author can edit this DM message".into());
    }

    if msg.is_deleted {
        return Err("Cannot edit a deleted message".into());
    }

    msg.content = new_content;
    msg.edited_at = Some(ctx.timestamp);
    ctx.db.dm_message().dm_message_id().update(msg);

    Ok(())
}

/// Soft-delete a direct-message message.
#[spacetimedb::reducer]
pub fn delete_dm_message(ctx: &ReducerContext, dm_message_id: u64) -> Result<(), String> {
    let mut msg = ctx
        .db
        .dm_message()
        .dm_message_id()
        .find(dm_message_id)
        .ok_or("DM message not found")?;

    if msg.is_deleted {
        return Err("Message is already deleted".into());
    }

    let caller = ctx.sender();
    require_dm_participant(ctx, msg.dm_channel_id, &caller)?;
    if msg.author_identity != caller {
        return Err("Only the author can delete this DM message".into());
    }

    msg.is_deleted = true;
    msg.content = "[deleted]".into();
    msg.edited_at = Some(ctx.timestamp);
    ctx.db.dm_message().dm_message_id().update(msg);

    Ok(())
}

#[spacetimedb::view(accessor = my_dm_channels, public)]
pub fn my_dm_channels(ctx: &ViewContext) -> Vec<DmChannel> {
    let who = ctx.sender();
    my_dm_channel_ids(ctx, &who)
        .into_iter()
        .filter_map(|dm_channel_id| ctx.db.dm_channel().dm_channel_id().find(dm_channel_id))
        .collect()
}

#[spacetimedb::view(accessor = my_dm_participants, public)]
pub fn my_dm_participants(ctx: &ViewContext) -> Vec<DmParticipant> {
    let who = ctx.sender();
    let mut participants = Vec::new();

    for dm_channel_id in my_dm_channel_ids(ctx, &who) {
        participants.extend(
            ctx.db
                .dm_participant()
                .dm_participant_by_dm_channel_id()
                .filter(dm_channel_id),
        );
    }

    participants
}

#[spacetimedb::view(accessor = my_dm_messages, public)]
pub fn my_dm_messages(ctx: &ViewContext) -> Vec<DmMessage> {
    let who = ctx.sender();
    let mut messages = Vec::new();

    for dm_channel_id in my_dm_channel_ids(ctx, &who) {
        messages.extend(
            ctx.db
                .dm_message()
                .dm_message_by_dm_channel_id()
                .filter(dm_channel_id),
        );
    }

    messages
}

#[spacetimedb::view(accessor = my_dm_typing, public)]
pub fn my_dm_typing(ctx: &ViewContext) -> Vec<DmTyping> {
    let who = ctx.sender();
    let mut rows = Vec::new();

    for dm_channel_id in my_dm_channel_ids(ctx, &who) {
        rows.extend(
            ctx.db
                .dm_typing()
                .dm_typing_by_dm_channel_id()
                .filter(dm_channel_id),
        );
    }

    rows
}

#[cfg(test)]
mod tests {
    use super::{collect_valid_dm_channel_ids, validate_dm_read_cursor_advance};

    #[test]
    fn collect_valid_dm_channel_ids_filters_orphaned_rows_and_dedupes() {
        let participant_channel_ids = vec![1_u64, 2, 2, 3, 4];
        let result = collect_valid_dm_channel_ids(participant_channel_ids, |id| id == 2 || id == 4);

        let collected: Vec<u64> = result.into_iter().collect();
        assert_eq!(collected, vec![2, 4]);
    }

    #[test]
    fn collect_valid_dm_channel_ids_returns_empty_when_no_valid_channel_exists() {
        let participant_channel_ids = vec![10_u64, 11, 12];
        let result = collect_valid_dm_channel_ids(participant_channel_ids, |_| false);

        assert!(result.is_empty());
    }

    #[test]
    fn validate_dm_read_cursor_advance_allows_initial_and_forward_progress() {
        assert!(validate_dm_read_cursor_advance(None, 5).is_ok());
        assert!(validate_dm_read_cursor_advance(Some(5), 5).is_ok());
        assert!(validate_dm_read_cursor_advance(Some(5), 6).is_ok());
    }

    #[test]
    fn validate_dm_read_cursor_advance_rejects_backwards_progress() {
        let result = validate_dm_read_cursor_advance(Some(10), 9);
        assert_eq!(
            result,
            Err("Cannot move DM read cursor backwards".to_string())
        );
    }
}
