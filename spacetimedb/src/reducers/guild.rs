use crate::{
    helpers::{
        cleanup_member_voice_and_signals_in_guild, delete_channel_cascade, find_member,
        require_role,
    },
    tables::{
        channel as _, guild as _, guild__view as _, guild_invite as _, guild_member as _,
        guild_member__view as _, user as _, Channel, Guild, GuildInvite, GuildMember,
    },
    types::{ChannelType, MemberRole},
};
use spacetimedb::{Identity, ReducerContext, Table, ViewContext};

fn my_guild_ids(ctx: &ViewContext, identity: &Identity) -> std::collections::BTreeSet<u64> {
    ctx.db
        .guild_member()
        .identity()
        .filter(identity)
        .map(|member| member.guild_id)
        .collect()
}

/// Create a new guild. The caller becomes the Owner.
#[spacetimedb::reducer]
pub fn create_guild(ctx: &ReducerContext, name: String) -> Result<(), String> {
    let who = ctx.sender();
    let name = name.trim().to_string();

    if name.is_empty() || name.len() > 100 {
        return Err("Guild name must be 1–100 characters".into());
    }
    if ctx.db.user().identity().find(who).is_none() {
        return Err("You must register before creating a guild".into());
    }

    let owned_count = ctx
        .db
        .guild()
        .iter()
        .filter(|g| g.owner_identity == who)
        .count();
    if owned_count > 0 {
        return Err(
            "You can only own one guild. Delete your existing guild to create a new one."
                .to_string(),
        );
    }

    let guild = ctx.db.guild().insert(Guild {
        guild_id: 0, // auto_inc
        name: name.clone(),
        avatar_bytes: None,
        bio: None,
        owner_identity: who,
        created_at: ctx.timestamp,
    });

    // Add the creator as Owner member
    ctx.db.guild_member().insert(GuildMember {
        id: 0, // auto_inc
        guild_id: guild.guild_id,
        identity: who,
        nickname: None,
        role: MemberRole::Owner,
        joined_at: ctx.timestamp,
    });

    // Create a default #general text channel
    ctx.db.channel().insert(Channel {
        channel_id: 0,
        guild_id: guild.guild_id,
        category_id: None,
        name: "general".into(),
        channel_type: ChannelType::Text,
        position: 0,
        topic: Some("General discussion".into()),
        created_at: ctx.timestamp,
    });

    log::info!(
        "Guild '{}' (id={}) created by {}",
        name,
        guild.guild_id,
        who.to_abbreviated_hex()
    );
    Ok(())
}

/// Invite a user to a guild. Caller must be Admin or higher.
/// Creates a pending GuildInvite instead of directly adding a member.
#[spacetimedb::reducer]
pub fn invite_member(
    ctx: &ReducerContext,
    guild_id: u64,
    target_identity: Identity,
) -> Result<(), String> {
    require_role(ctx, guild_id, MemberRole::Admin)?;

    ctx.db
        .guild()
        .guild_id()
        .find(guild_id)
        .ok_or("Guild not found")?;

    ctx.db
        .user()
        .identity()
        .find(target_identity)
        .ok_or("Target user is not registered")?;

    if find_member(ctx, guild_id, &target_identity).is_some() {
        return Err("User is already a member".into());
    }

    // Check no pending invite exists
    let already_invited = ctx
        .db
        .guild_invite()
        .invitee_identity()
        .filter(target_identity)
        .any(|i| i.guild_id == guild_id);
    if already_invited {
        return Err("User already has a pending invite to this guild".into());
    }

    ctx.db.guild_invite().insert(GuildInvite {
        invite_id: 0,
        guild_id,
        inviter_identity: ctx.sender(),
        invitee_identity: target_identity,
        created_at: ctx.timestamp,
    });

    Ok(())
}

/// Join a guild by name.
#[spacetimedb::reducer]
pub fn join_guild(ctx: &ReducerContext, guild_name: String) -> Result<(), String> {
    let who = ctx.sender();

    if ctx.db.user().identity().find(who).is_none() {
        return Err("You must register before joining a guild".into());
    }

    let guild = ctx
        .db
        .guild()
        .iter()
        .find(|g| g.name == guild_name)
        .ok_or("Guild not found")?;
    let guild_id = guild.guild_id;

    if find_member(ctx, guild_id, &who).is_some() {
        return Err("You are already a member".into());
    }

    ctx.db.guild_member().insert(GuildMember {
        id: 0,
        guild_id,
        identity: who,
        nickname: None,
        role: MemberRole::Member,
        joined_at: ctx.timestamp,
    });

    Ok(())
}

/// Remove a member from a guild. Caller must be Admin or higher and outrank the target.
#[spacetimedb::reducer]
pub fn kick_member(
    ctx: &ReducerContext,
    guild_id: u64,
    target_identity: Identity,
) -> Result<(), String> {
    let caller_member = require_role(ctx, guild_id, MemberRole::Admin)?;
    let target_member =
        find_member(ctx, guild_id, &target_identity).ok_or("Target user is not a member")?;

    // Cannot kick someone of equal or higher rank
    if target_member.role >= caller_member.role {
        return Err("Cannot kick a member of equal or higher role".into());
    }

    ctx.db.guild_member().id().delete(target_member.id);
    cleanup_member_voice_and_signals_in_guild(ctx, guild_id, &target_identity);
    Ok(())
}

/// Leave a guild voluntarily. The Owner cannot leave (must transfer/delete guild first).
#[spacetimedb::reducer]
pub fn leave_guild(ctx: &ReducerContext, guild_id: u64) -> Result<(), String> {
    let who = ctx.sender();
    let member = find_member(ctx, guild_id, &who).ok_or("You are not a member")?;

    if member.role == MemberRole::Owner {
        return Err(
            "The guild owner cannot leave. Delete the guild or transfer ownership first.".into(),
        );
    }

    ctx.db.guild_member().id().delete(member.id);
    cleanup_member_voice_and_signals_in_guild(ctx, guild_id, &who);
    Ok(())
}

/// Delete a guild entirely. Only the Owner may do this.
/// Removes all members, channels, messages, reactions, voice states, and RTC signals.
#[spacetimedb::reducer]
pub fn delete_guild(ctx: &ReducerContext, guild_id: u64) -> Result<(), String> {
    let who = ctx.sender();

    let guild = ctx
        .db
        .guild()
        .guild_id()
        .find(guild_id)
        .ok_or("Guild not found")?;

    if guild.owner_identity != who {
        return Err("Only the guild owner can delete the guild".into());
    }

    // Delete all guild members
    let member_ids: Vec<u64> = ctx
        .db
        .guild_member()
        .guild_id()
        .filter(guild_id)
        .map(|m| m.id)
        .collect();
    for id in member_ids {
        ctx.db.guild_member().id().delete(id);
    }

    // Delete all pending guild invites
    let invite_ids: Vec<u64> = ctx
        .db
        .guild_invite()
        .guild_id()
        .filter(guild_id)
        .map(|i| i.invite_id)
        .collect();
    for id in invite_ids {
        ctx.db.guild_invite().invite_id().delete(id);
    }

    // Delete all channels and their associated data
    let channel_ids: Vec<u64> = ctx
        .db
        .channel()
        .guild_id()
        .filter(guild_id)
        .map(|c| c.channel_id)
        .collect();
    for channel_id in channel_ids {
        delete_channel_cascade(ctx, channel_id);
        ctx.db.channel().channel_id().delete(channel_id);
    }

    // Delete the guild itself
    ctx.db.guild().guild_id().delete(guild_id);

    log::info!(
        "Guild '{}' (id={}) deleted by {}",
        guild.name,
        guild_id,
        who.to_abbreviated_hex()
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn update_guild(
    ctx: &ReducerContext,
    guild_id: u64,
    name: Option<String>,
    bio: Option<String>,
    avatar_bytes: Option<Vec<u8>>,
) -> Result<(), String> {
    let who = ctx.sender();
    let mut guild = ctx
        .db
        .guild()
        .guild_id()
        .find(guild_id)
        .ok_or("Guild not found")?;

    if guild.owner_identity != who {
        return Err("Only the guild owner can update server settings".into());
    }

    if let Some(next_name) = name {
        let next_name = next_name.trim().to_string();
        if next_name.is_empty() || next_name.len() > 100 {
            return Err("Guild name must be 1–100 characters".into());
        }
        guild.name = next_name;
    }

    if let Some(next_bio) = bio {
        let next_bio = next_bio.trim().to_string();
        guild.bio = if next_bio.is_empty() {
            None
        } else {
            Some(next_bio)
        };
    }

    guild.avatar_bytes = avatar_bytes;
    ctx.db.guild().guild_id().update(guild);
    Ok(())
}

#[spacetimedb::view(accessor = my_guilds, public)]
pub fn my_guilds(ctx: &ViewContext) -> Vec<Guild> {
    let who = ctx.sender();
    my_guild_ids(ctx, &who)
        .into_iter()
        .filter_map(|guild_id| ctx.db.guild().guild_id().find(guild_id))
        .collect()
}

#[spacetimedb::view(accessor = my_guild_members, public)]
pub fn my_guild_members(ctx: &ViewContext) -> Vec<GuildMember> {
    let who = ctx.sender();
    let mut members = Vec::new();

    for guild_id in my_guild_ids(ctx, &who) {
        members.extend(ctx.db.guild_member().guild_id().filter(guild_id));
    }

    members
}
