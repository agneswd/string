use crate::tables::{channel as _, channel__view as _, guild_member__view as _};
use crate::{
    helpers::{delete_channel_cascade, require_role},
    tables::Channel,
    types::{ChannelType, MemberRole},
};
use spacetimedb::{ReducerContext, Table, ViewContext};

/// Create a new channel in a guild. Caller must be Admin or higher.
#[spacetimedb::reducer]
pub fn create_channel(
    ctx: &ReducerContext,
    guild_id: u64,
    name: String,
    channel_type: ChannelType,
) -> Result<(), String> {
    require_role(ctx, guild_id, MemberRole::Admin)?;

    let name = name.trim().to_string();
    if name.is_empty() || name.len() > 100 {
        return Err("Channel name must be 1–100 characters".into());
    }

    // Calculate next position
    let position = ctx.db.channel().guild_id().filter(guild_id).count() as u32;

    ctx.db.channel().insert(Channel {
        channel_id: 0,
        guild_id,
        name,
        channel_type,
        position,
        topic: None,
        created_at: ctx.timestamp,
    });

    Ok(())
}

/// Delete a channel. Caller must be Admin or higher.
#[spacetimedb::reducer]
pub fn delete_channel(ctx: &ReducerContext, channel_id: u64) -> Result<(), String> {
    let channel = ctx
        .db
        .channel()
        .channel_id()
        .find(channel_id)
        .ok_or("Channel not found")?;

    require_role(ctx, channel.guild_id, MemberRole::Admin)?;

    delete_channel_cascade(ctx, channel_id);
    ctx.db.channel().channel_id().delete(channel_id);
    Ok(())
}

/// Update channel name or topic. Caller must be Admin or higher.
#[spacetimedb::reducer]
pub fn update_channel(
    ctx: &ReducerContext,
    channel_id: u64,
    name: Option<String>,
    topic: Option<String>,
) -> Result<(), String> {
    let mut channel = ctx
        .db
        .channel()
        .channel_id()
        .find(channel_id)
        .ok_or("Channel not found")?;

    require_role(ctx, channel.guild_id, MemberRole::Admin)?;

    if let Some(n) = name {
        let n = n.trim().to_string();
        if n.is_empty() || n.len() > 100 {
            return Err("Channel name must be 1–100 characters".into());
        }
        channel.name = n;
    }

    if let Some(t) = topic {
        let t = t.trim().to_string();
        channel.topic = if t.is_empty() { None } else { Some(t) };
    }

    ctx.db.channel().channel_id().update(channel);
    Ok(())
}

#[spacetimedb::view(accessor = my_channels, public)]
pub fn my_channels(ctx: &ViewContext) -> Vec<Channel> {
    let who = ctx.sender();
    let guild_ids: std::collections::BTreeSet<u64> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&who)
        .map(|membership| membership.guild_id)
        .collect();

    let mut channels = Vec::new();
    for guild_id in guild_ids {
        channels.extend(ctx.db.channel().guild_id().filter(guild_id));
    }

    channels
}
