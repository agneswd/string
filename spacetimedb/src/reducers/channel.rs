use crate::tables::{channel as _, channel__view as _, guild_member__view as _};
use crate::{
    helpers::{delete_channel_cascade, require_role},
    tables::Channel,
    types::{ChannelLayoutItem, ChannelType, MemberRole},
};
use spacetimedb::{ReducerContext, Table, ViewContext};

fn sort_channels(channels: &mut [Channel]) {
    channels.sort_by(|left, right| {
        left.position
            .cmp(&right.position)
            .then(left.channel_id.cmp(&right.channel_id))
    });
}

fn validate_parent_category(
    ctx: &ReducerContext,
    guild_id: u64,
    channel_type: &ChannelType,
    parent_category_id: Option<u64>,
) -> Result<Option<u64>, String> {
    if *channel_type == ChannelType::Category {
        return Ok(None);
    }

    let Some(category_id) = parent_category_id else {
        return Ok(None);
    };

    let parent = ctx
        .db
        .channel()
        .channel_id()
        .find(category_id)
        .ok_or("Category not found")?;

    if parent.guild_id != guild_id {
        return Err("Category must belong to the same guild".into());
    }

    if parent.channel_type != ChannelType::Category {
        return Err("Parent channel must be a category".into());
    }

    Ok(Some(category_id))
}

fn next_position(ctx: &ReducerContext, guild_id: u64, category_id: Option<u64>) -> u32 {
    ctx.db
        .channel()
        .guild_id()
        .filter(guild_id)
        .filter(|channel| channel.category_id == category_id)
        .map(|channel| channel.position)
        .max()
        .map_or(0, |position| position.saturating_add(1))
}

fn normalize_bucket_positions(ctx: &ReducerContext, guild_id: u64, category_id: Option<u64>) {
    let mut channels: Vec<Channel> = ctx
        .db
        .channel()
        .guild_id()
        .filter(guild_id)
        .filter(|channel| channel.category_id == category_id)
        .collect();
    sort_channels(&mut channels);

    for (index, mut channel) in channels.into_iter().enumerate() {
        let next_position = index as u32;
        if channel.position != next_position || channel.category_id != category_id {
            channel.position = next_position;
            channel.category_id = category_id;
            ctx.db.channel().channel_id().update(channel);
        }
    }
}

fn lift_category_children_to_root(ctx: &ReducerContext, category: &Channel) {
    let mut root_channels: Vec<Channel> = ctx
        .db
        .channel()
        .guild_id()
        .filter(category.guild_id)
        .filter(|channel| channel.category_id.is_none())
        .collect();
    sort_channels(&mut root_channels);

    let category_index = root_channels
        .iter()
        .position(|channel| channel.channel_id == category.channel_id)
        .unwrap_or(root_channels.len());

    root_channels.retain(|channel| channel.channel_id != category.channel_id);

    let mut child_channels: Vec<Channel> = ctx
        .db
        .channel()
        .guild_id()
        .filter(category.guild_id)
        .filter(|channel| channel.category_id == Some(category.channel_id))
        .collect();
    sort_channels(&mut child_channels);

    let insert_index = category_index.min(root_channels.len());
    for (offset, child) in child_channels.into_iter().enumerate() {
        root_channels.insert(insert_index + offset, child);
    }

    for (index, mut channel) in root_channels.into_iter().enumerate() {
        let next_position = index as u32;
        if channel.category_id.is_some() || channel.position != next_position {
            channel.category_id = None;
            channel.position = next_position;
            ctx.db.channel().channel_id().update(channel);
        }
    }
}

/// Create a new channel in a guild. Caller must be Admin or higher.
#[spacetimedb::reducer]
pub fn create_channel(
    ctx: &ReducerContext,
    guild_id: u64,
    name: String,
    channel_type: ChannelType,
    parent_category_id: Option<u64>,
) -> Result<(), String> {
    require_role(ctx, guild_id, MemberRole::Admin)?;

    let name = name.trim().to_string();
    if name.is_empty() || name.len() > 100 {
        return Err("Channel name must be 1–100 characters".into());
    }

    let category_id = validate_parent_category(ctx, guild_id, &channel_type, parent_category_id)?;
    let position = next_position(ctx, guild_id, category_id);

    ctx.db.channel().insert(Channel {
        channel_id: 0,
        guild_id,
        category_id,
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

    if channel.channel_type == ChannelType::Category {
        lift_category_children_to_root(ctx, &channel);
    }

    delete_channel_cascade(ctx, channel_id);
    ctx.db.channel().channel_id().delete(channel_id);

    normalize_bucket_positions(
        ctx,
        channel.guild_id,
        if channel.channel_type == ChannelType::Category {
            None
        } else {
            channel.category_id
        },
    );

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

#[spacetimedb::reducer]
pub fn save_channel_layout(
    ctx: &ReducerContext,
    guild_id: u64,
    layout: Vec<ChannelLayoutItem>,
) -> Result<(), String> {
    require_role(ctx, guild_id, MemberRole::Admin)?;

    for item in &layout {
        let existing = ctx
            .db
            .channel()
            .channel_id()
            .find(item.channel_id)
            .ok_or("Channel not found")?;

        if existing.guild_id != guild_id {
            return Err("All reordered channels must belong to the same guild".into());
        }

        if existing.channel_type == ChannelType::Category && item.category_id.is_some() {
            return Err("Categories cannot be nested under other categories".into());
        }

        if let Some(category_id) = item.category_id {
            let category = ctx
                .db
                .channel()
                .channel_id()
                .find(category_id)
                .ok_or("Category not found")?;

            if category.guild_id != guild_id || category.channel_type != ChannelType::Category {
                return Err("Channels can only be placed under categories in the same guild".into());
            }
        }
    }

    for item in layout {
        if let Some(mut channel) = ctx.db.channel().channel_id().find(item.channel_id) {
            channel.category_id = item.category_id;
            channel.position = item.position;
            ctx.db.channel().channel_id().update(channel);
        }
    }

    normalize_bucket_positions(ctx, guild_id, None);

    let category_ids: Vec<u64> = ctx
        .db
        .channel()
        .guild_id()
        .filter(guild_id)
        .filter(|channel| channel.channel_type == ChannelType::Category)
        .map(|channel| channel.channel_id)
        .collect();

    for category_id in category_ids {
        normalize_bucket_positions(ctx, guild_id, Some(category_id));
    }

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
