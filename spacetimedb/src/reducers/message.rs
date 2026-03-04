use crate::{
    helpers::require_role,
    tables::{
        channel, channel__view, guild_member__view, message, message__view, Message,
    },
    types::MemberRole,
};
use spacetimedb::{ReducerContext, Table, ViewContext};

fn require_channel_member(ctx: &ReducerContext, channel_id: u64) -> Result<u64, String> {
    let channel = ctx
        .db
        .channel()
        .channel_id()
        .find(channel_id)
        .ok_or("Channel not found")?;

    require_role(ctx, channel.guild_id, MemberRole::Member)?;
    Ok(channel.guild_id)
}

/// Send a message to a channel. Caller must be a guild member.
#[spacetimedb::reducer]
pub fn send_message(
    ctx: &ReducerContext,
    channel_id: u64,
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

    // Verify the channel exists and the caller is a guild member
    require_channel_member(ctx, channel_id)?;

    // If replying, verify the referenced message exists in the same channel
    if let Some(ref_id) = reply_to {
        let ref_msg = ctx
            .db
            .message()
            .message_id()
            .find(ref_id)
            .ok_or("Referenced message not found")?;
        if ref_msg.channel_id != channel_id {
            return Err("Cannot reply to a message in a different channel".into());
        }
    }

    ctx.db.message().insert(Message {
        message_id: 0, // auto_inc
        channel_id,
        author_identity: ctx.sender(),
        content,
        sent_at: ctx.timestamp,
        edited_at: None,
        is_deleted: false,
        reply_to,
    });

    Ok(())
}

/// Edit own message. Only the original author can edit.
#[spacetimedb::reducer]
pub fn edit_message(
    ctx: &ReducerContext,
    message_id: u64,
    new_content: String,
) -> Result<(), String> {
    let new_content = new_content.trim().to_string();
    if new_content.is_empty() || new_content.len() > 4000 {
        return Err("Edited content must be 1–4000 characters".into());
    }

    let mut msg = ctx
        .db
        .message()
        .message_id()
        .find(message_id)
        .ok_or("Message not found")?;

    require_channel_member(ctx, msg.channel_id)?;

    if msg.author_identity != ctx.sender() {
        return Err("You can only edit your own messages".into());
    }
    if msg.is_deleted {
        return Err("Cannot edit a deleted message".into());
    }

    msg.content = new_content;
    msg.edited_at = Some(ctx.timestamp);
    ctx.db.message().message_id().update(msg);
    Ok(())
}

/// Soft-delete a message. Author can delete their own; Moderator+ can delete any.
#[spacetimedb::reducer]
pub fn delete_message(ctx: &ReducerContext, message_id: u64) -> Result<(), String> {
    let mut msg = ctx
        .db
        .message()
        .message_id()
        .find(message_id)
        .ok_or("Message not found")?;

    let guild_id = require_channel_member(ctx, msg.channel_id)?;

    if msg.is_deleted {
        return Err("Message is already deleted".into());
    }

    let caller = ctx.sender();
    let is_author = msg.author_identity == caller;

    if !is_author {
        // Non-authors need Moderator role or higher
        require_role(ctx, guild_id, MemberRole::Moderator)?;
    }

    msg.is_deleted = true;
    msg.content = "[deleted]".into(); // wipe content on delete
    msg.edited_at = Some(ctx.timestamp);
    ctx.db.message().message_id().update(msg);
    Ok(())
}

#[spacetimedb::view(accessor = my_messages, public)]
pub fn my_messages(ctx: &ViewContext) -> Vec<Message> {
    let who = ctx.sender();
    let guild_ids: std::collections::BTreeSet<u64> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&who)
        .map(|member| member.guild_id)
        .collect();

    let mut messages = Vec::new();
    for guild_id in guild_ids {
        for channel in ctx.db.channel().guild_id().filter(guild_id) {
            messages.extend(ctx.db.message().channel_id().filter(channel.channel_id));
        }
    }

    messages
}
