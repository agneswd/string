use crate::{
    helpers::find_member,
    tables::{
        guild as _, guild_invite as _, guild_member as _,
        GuildMember,
    },
    types::MemberRole,
};
use spacetimedb::{ReducerContext, Table};

#[spacetimedb::reducer]
pub fn accept_guild_invite(ctx: &ReducerContext, invite_id: u64) -> Result<(), String> {
    let invite = ctx.db.guild_invite().invite_id().find(invite_id)
        .ok_or("Invite not found")?;

    if invite.invitee_identity != ctx.sender() {
        return Err("This invite is not for you".into());
    }

    // Verify guild still exists
    ctx.db.guild().guild_id().find(invite.guild_id)
        .ok_or("Guild no longer exists")?;

    // Check not already a member (could have joined via another route)
    if find_member(ctx, invite.guild_id, &ctx.sender()).is_some() {
        ctx.db.guild_invite().invite_id().delete(invite_id);
        return Err("You are already a member of this guild".into());
    }

    // Add as member
    ctx.db.guild_member().insert(GuildMember {
        id: 0,
        guild_id: invite.guild_id,
        identity: ctx.sender(),
        nickname: None,
        role: MemberRole::Member,
        joined_at: ctx.timestamp,
    });

    // Delete the invite
    ctx.db.guild_invite().invite_id().delete(invite_id);

    Ok(())
}

#[spacetimedb::reducer]
pub fn decline_guild_invite(ctx: &ReducerContext, invite_id: u64) -> Result<(), String> {
    let invite = ctx.db.guild_invite().invite_id().find(invite_id)
        .ok_or("Invite not found")?;

    if invite.invitee_identity != ctx.sender() {
        return Err("This invite is not for you".into());
    }

    ctx.db.guild_invite().invite_id().delete(invite_id);
    Ok(())
}
