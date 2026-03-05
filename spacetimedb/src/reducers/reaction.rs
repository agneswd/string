use crate::{
    helpers::require_role,
    tables::{
        channel as _, channel__view as _, guild_member__view as _, message as _,
        message__view as _, reaction as _, reaction__view as _, Reaction,
    },
    types::MemberRole,
};
use spacetimedb::{ReducerContext, Table, ViewContext};
use std::collections::{BTreeMap, BTreeSet};

const MAX_EMOJI_CHARS: usize = 64;

pub(super) fn normalize_and_validate_emoji(emoji: String) -> Result<String, String> {
    let emoji = emoji.trim().to_string();
    if emoji.is_empty() {
        return Err("Emoji cannot be empty".into());
    }
    if emoji.chars().count() > MAX_EMOJI_CHARS {
        return Err(format!("Emoji must be ≤ {} characters", MAX_EMOJI_CHARS));
    }
    Ok(emoji)
}

fn require_reactable_message(ctx: &ReducerContext, message_id: u64) -> Result<u64, String> {
    let msg = ctx
        .db
        .message()
        .message_id()
        .find(message_id)
        .ok_or("Message not found")?;

    if msg.is_deleted {
        return Err("Cannot react to a deleted message".into());
    }

    let msg_channel = ctx
        .db
        .channel()
        .channel_id()
        .find(msg.channel_id)
        .ok_or("Channel not found")?;

    require_role(ctx, msg_channel.guild_id, MemberRole::Member)?;
    Ok(msg.channel_id)
}

fn find_matching_reaction_ids(ctx: &ReducerContext, message_id: u64, emoji: &str) -> Vec<u64> {
    let caller = ctx.sender();
    ctx.db
        .reaction()
        .iter()
        .filter(|row| {
            row.message_id == message_id && row.reactor_identity == caller && row.emoji == emoji
        })
        .map(|row| row.reaction_id)
        .collect()
}

fn reaction_visible_to_member_guilds(
    message_id: u64,
    channel_id: u64,
    message_channels: &BTreeMap<u64, u64>,
    member_channel_ids: &BTreeSet<u64>,
) -> bool {
    if !member_channel_ids.contains(&channel_id) {
        return false;
    }

    let Some(message_channel_id) = message_channels.get(&message_id) else {
        return false;
    };

    *message_channel_id == channel_id
}

#[spacetimedb::reducer]
pub fn add_reaction(ctx: &ReducerContext, message_id: u64, emoji: String) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    let channel_id = require_reactable_message(ctx, message_id)?;

    if !find_matching_reaction_ids(ctx, message_id, &emoji).is_empty() {
        return Err("Reaction already exists".into());
    }

    ctx.db.reaction().insert(Reaction {
        reaction_id: 0,
        message_id,
        channel_id,
        reactor_identity: ctx.sender(),
        emoji,
        reacted_at: ctx.timestamp,
    });

    Ok(())
}

#[spacetimedb::reducer]
pub fn remove_reaction(ctx: &ReducerContext, message_id: u64, emoji: String) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    require_reactable_message(ctx, message_id)?;

    let reaction_ids = find_matching_reaction_ids(ctx, message_id, &emoji);
    if reaction_ids.is_empty() {
        return Err("Reaction not found".into());
    }

    for reaction_id in reaction_ids {
        ctx.db.reaction().reaction_id().delete(reaction_id);
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn toggle_reaction(ctx: &ReducerContext, message_id: u64, emoji: String) -> Result<(), String> {
    let emoji = normalize_and_validate_emoji(emoji)?;
    let channel_id = require_reactable_message(ctx, message_id)?;

    let reaction_ids = find_matching_reaction_ids(ctx, message_id, &emoji);
    if reaction_ids.is_empty() {
        ctx.db.reaction().insert(Reaction {
            reaction_id: 0,
            message_id,
            channel_id,
            reactor_identity: ctx.sender(),
            emoji,
            reacted_at: ctx.timestamp,
        });
    } else {
        for reaction_id in reaction_ids {
            ctx.db.reaction().reaction_id().delete(reaction_id);
        }
    }

    Ok(())
}

#[spacetimedb::view(accessor = my_reactions, public)]
pub fn my_reactions(ctx: &ViewContext) -> Vec<Reaction> {
    let who = ctx.sender();
    let member_guild_ids: BTreeSet<u64> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&who)
        .map(|member| member.guild_id)
        .collect();

    let member_channel_ids: BTreeSet<u64> = member_guild_ids
        .iter()
        .flat_map(|guild_id| ctx.db.channel().guild_id().filter(guild_id))
        .map(|channel| channel.channel_id)
        .collect();

    let message_channels: BTreeMap<u64, u64> = member_channel_ids
        .iter()
        .flat_map(|channel_id| ctx.db.message().channel_id().filter(channel_id))
        .map(|msg| (msg.message_id, msg.channel_id))
        .collect();

    let mut reactions = Vec::new();

    for channel_id in &member_channel_ids {
        reactions.extend(
            ctx.db
                .reaction()
                .reaction_by_channel_id()
                .filter(channel_id)
                .filter(|row| {
                    reaction_visible_to_member_guilds(
                        row.message_id,
                        row.channel_id,
                        &message_channels,
                        &member_channel_ids,
                    )
                }),
        );
    }

    reactions
}

#[cfg(test)]
mod tests {
    use super::reaction_visible_to_member_guilds;
    use std::collections::{BTreeMap, BTreeSet};

    #[test]
    fn reaction_visibility_requires_member_channel_and_consistent_message_channel() {
        let message_channels = BTreeMap::from([(10_u64, 5_u64)]);
        let member_channel_ids = BTreeSet::from([5_u64]);

        assert!(reaction_visible_to_member_guilds(
            10,
            5,
            &message_channels,
            &member_channel_ids,
        ));
        assert!(!reaction_visible_to_member_guilds(
            10,
            6,
            &message_channels,
            &member_channel_ids,
        ));
    }

    #[test]
    fn reaction_visibility_requires_existing_message_and_channel() {
        let message_channels = BTreeMap::new();
        let member_channel_ids = BTreeSet::from([5_u64]);

        assert!(!reaction_visible_to_member_guilds(
            10,
            5,
            &message_channels,
            &member_channel_ids,
        ));
    }
}
