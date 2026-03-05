use crate::{
    cancel_offline_jobs_for, emit_presence_change, status_after_login_identity_transfer,
    update_user_status_if_changed,
    tables::{
        dm_call_request as _, dm_channel as _, dm_message as _, dm_participant as _, friend as _,
        friend__view as _, friend_request as _, guild as _, guild_member as _,
        guild_member__view as _, message as _, presence_state as _, reaction as _, rtc_signal as _,
        user as _, user__view as _, voice_state as _, DmCallRequest, DmChannel, DmMessage,
        DmParticipant, Friend, FriendRequest, Guild, GuildMember, Message, PresenceState, Reaction,
        RtcSignal, User, VoiceState,
    },
    types::UserStatus,
};
use spacetimedb::{ReducerContext, Table, ViewContext};

/// Register a new user profile. Must be called once after first connection.
/// Errors if the username is already taken or the identity already exists.
#[spacetimedb::reducer]
pub fn register_user(
    ctx: &ReducerContext,
    username: String,
    display_name: String,
) -> Result<(), String> {
    let who = ctx.sender();

    // Validate input
    let username = username.trim().to_string();
    let display_name = display_name.trim().to_string();
    if username.is_empty() || username.len() > 32 {
        return Err("Username must be 1–32 characters".into());
    }
    if display_name.is_empty() || display_name.len() > 64 {
        return Err("Display name must be 1–64 characters".into());
    }

    // Check for conflicts
    if ctx.db.user().identity().find(who).is_some() {
        return Err("This identity is already registered".into());
    }
    if ctx.db.user().username().find(&username).is_some() {
        return Err(format!("Username '{}' is already taken", username));
    }

    ctx.db.user().insert(User {
        identity: who,
        username,
        display_name,
        bio: None,
        avatar_bytes: None,
        profile_color: None,
        status: UserStatus::Online,
        created_at: ctx.timestamp,
    });
    emit_presence_change(ctx, who, UserStatus::Online);

    log::info!("User registered: {}", who.to_abbreviated_hex());
    Ok(())
}

/// Update own display name, bio, or avatar.
#[spacetimedb::reducer]
pub fn update_profile(
    ctx: &ReducerContext,
    display_name: Option<String>,
    bio: Option<String>,
    avatar_bytes: Option<Vec<u8>>,
    profile_color: Option<String>,
) -> Result<(), String> {
    let who = ctx.sender();
    let mut user = ctx
        .db
        .user()
        .identity()
        .find(who)
        .ok_or("User not found — call register_user first")?;

    if let Some(name) = display_name {
        let name = name.trim().to_string();
        if name.is_empty() || name.len() > 64 {
            return Err("Display name must be 1–64 characters".into());
        }
        user.display_name = name;
    }

    if let Some(bio_text) = bio {
        if bio_text.len() > 500 {
            return Err("Bio must be ≤ 500 characters".into());
        }
        user.bio = if bio_text.is_empty() {
            None
        } else {
            Some(bio_text)
        };
    }

    if let Some(bytes) = avatar_bytes {
        if bytes.len() > 102_400 {
            // 100KB cap — avatars larger than this should be served from blob storage
            return Err("Avatar must be ≤ 100 KB".into());
        }
        user.avatar_bytes = Some(bytes);
    }

    if let Some(color) = profile_color {
        if color.len() > 7 {
            return Err("Profile color must be a valid hex color".into());
        }
        user.profile_color = if color.is_empty() { None } else { Some(color) };
    }

    ctx.db.user().identity().update(user);
    Ok(())
}

/// Set own online status.
#[spacetimedb::reducer]
pub fn set_status(ctx: &ReducerContext, status: UserStatus) -> Result<(), String> {
    let who = ctx.sender();
    let mut user = ctx.db.user().identity().find(who).ok_or("User not found")?;
    update_user_status_if_changed(ctx, &mut user, status);
    Ok(())
}

/// Login as an existing user by username.
/// Transfers the target user's identity to the caller's identity,
/// cascading across all FK references.
#[spacetimedb::reducer]
pub fn login_as_user(ctx: &ReducerContext, username: String) -> Result<(), String> {
    let new_identity = ctx.sender();
    let username = username.trim().to_string();

    if username.is_empty() {
        return Err("Username cannot be empty".to_string());
    }

    // Reject if caller already has a profile
    if ctx.db.user().identity().find(new_identity).is_some() {
        return Err("You already have a profile".to_string());
    }

    // Find target user by username
    let target = ctx
        .db
        .user()
        .username()
        .find(&username)
        .ok_or_else(|| format!("No user named '{}'", username))?;

    let old_identity = target.identity;

    let old_presence_state = ctx.db.presence_state().identity().find(old_identity);
    let new_presence_state = ctx.db.presence_state().identity().find(new_identity);

    let old_status_before_disconnect = old_presence_state
        .as_ref()
        .and_then(|state| state.status_before_disconnect.clone());
    let new_status_before_disconnect = new_presence_state
        .as_ref()
        .and_then(|state| state.status_before_disconnect.clone());
    let presence_state_migrations = usize::from(old_presence_state.is_some());

    let canceled_offline_jobs =
        cancel_offline_jobs_for(ctx, old_identity) + cancel_offline_jobs_for(ctx, new_identity);

    let mut reconciled_presence_state = new_presence_state.clone().unwrap_or(PresenceState {
        identity: new_identity,
        online_session_count: 0,
        status_before_disconnect: None,
        generation: 0,
    });
    reconciled_presence_state.online_session_count =
        reconciled_presence_state.online_session_count.max(1);
    if reconciled_presence_state.status_before_disconnect.is_none() {
        reconciled_presence_state.status_before_disconnect = old_status_before_disconnect.clone();
    }
    if let Some(old_state) = old_presence_state.as_ref() {
        reconciled_presence_state.generation = reconciled_presence_state
            .generation
            .max(old_state.generation);
    }
    reconciled_presence_state.generation = reconciled_presence_state.generation.wrapping_add(1);

    if let Some(_old_state) = old_presence_state {
        ctx.db.presence_state().identity().delete(old_identity);
    }

    if new_presence_state.is_some() {
        ctx.db
            .presence_state()
            .identity()
            .update(reconciled_presence_state);
    } else {
        ctx.db.presence_state().insert(reconciled_presence_state);
    }

    // Delete old user row, insert with new identity
    ctx.db.user().identity().delete(old_identity);
    let mut transferred_user = ctx.db.user().insert(User {
        identity: new_identity,
        ..target
    });

    if let Some(status) = status_after_login_identity_transfer(
        &transferred_user.status,
        new_status_before_disconnect.as_ref(),
        old_status_before_disconnect.as_ref(),
    ) {
        update_user_status_if_changed(ctx, &mut transferred_user, status);
    }

    // Cascade: Guild (owner_identity)
    let guilds: Vec<_> = ctx
        .db
        .guild()
        .iter()
        .filter(|g| g.owner_identity == old_identity)
        .collect();
    for g in guilds {
        ctx.db.guild().guild_id().delete(g.guild_id);
        ctx.db.guild().insert(Guild {
            owner_identity: new_identity,
            ..g
        });
    }

    // Cascade: GuildMember
    let members: Vec<_> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&old_identity)
        .collect();
    for m in members {
        ctx.db.guild_member().id().delete(m.id);
        ctx.db.guild_member().insert(GuildMember {
            identity: new_identity,
            ..m
        });
    }

    // Cascade: FriendRequest (as sender)
    let sent: Vec<_> = ctx
        .db
        .friend_request()
        .friend_request_by_sender_identity()
        .filter(&old_identity)
        .collect();
    for r in sent {
        ctx.db
            .friend_request()
            .friend_request_id()
            .delete(r.friend_request_id);
        ctx.db.friend_request().insert(FriendRequest {
            sender_identity: new_identity,
            ..r
        });
    }

    // Cascade: FriendRequest (as recipient)
    let recv: Vec<_> = ctx
        .db
        .friend_request()
        .friend_request_by_recipient_identity()
        .filter(&old_identity)
        .collect();
    for r in recv {
        ctx.db
            .friend_request()
            .friend_request_id()
            .delete(r.friend_request_id);
        ctx.db.friend_request().insert(FriendRequest {
            recipient_identity: new_identity,
            ..r
        });
    }

    // Cascade: Friend (identity_low)
    let friends_low: Vec<_> = ctx
        .db
        .friend()
        .friend_by_identity_low()
        .filter(&old_identity)
        .collect();
    for f in friends_low {
        ctx.db.friend().friend_id().delete(f.friend_id);
        ctx.db.friend().insert(Friend {
            identity_low: new_identity,
            ..f
        });
    }

    // Cascade: Friend (identity_high)
    let friends_high: Vec<_> = ctx
        .db
        .friend()
        .friend_by_identity_high()
        .filter(&old_identity)
        .collect();
    for f in friends_high {
        ctx.db.friend().friend_id().delete(f.friend_id);
        ctx.db.friend().insert(Friend {
            identity_high: new_identity,
            ..f
        });
    }

    // Cascade: Message (author_identity)
    let msgs: Vec<_> = ctx
        .db
        .message()
        .iter()
        .filter(|m| m.author_identity == old_identity)
        .collect();
    for m in msgs {
        ctx.db.message().message_id().delete(m.message_id);
        ctx.db.message().insert(Message {
            author_identity: new_identity,
            ..m
        });
    }

    // Cascade: DmChannel (created_by_identity)
    let dm_channels: Vec<_> = ctx
        .db
        .dm_channel()
        .dm_channel_by_created_by_identity()
        .filter(&old_identity)
        .collect();
    for dc in dm_channels {
        ctx.db.dm_channel().dm_channel_id().delete(dc.dm_channel_id);
        ctx.db.dm_channel().insert(DmChannel {
            created_by_identity: new_identity,
            ..dc
        });
    }

    // Cascade: DmMessage (author_identity)
    let dms: Vec<_> = ctx
        .db
        .dm_message()
        .dm_message_by_author_identity()
        .filter(&old_identity)
        .collect();
    for m in dms {
        ctx.db.dm_message().dm_message_id().delete(m.dm_message_id);
        ctx.db.dm_message().insert(DmMessage {
            author_identity: new_identity,
            ..m
        });
    }

    // Cascade: DmParticipant
    let parts: Vec<_> = ctx
        .db
        .dm_participant()
        .dm_participant_by_identity()
        .filter(&old_identity)
        .collect();
    for p in parts {
        ctx.db
            .dm_participant()
            .dm_participant_id()
            .delete(p.dm_participant_id);
        ctx.db.dm_participant().insert(DmParticipant {
            identity: new_identity,
            ..p
        });
    }

    // Cascade: DmCallRequest (caller_identity + callee_identity)
    let call_requests: Vec<_> = ctx
        .db
        .dm_call_request()
        .iter()
        .filter(|call| call.caller_identity == old_identity || call.callee_identity == old_identity)
        .collect();
    let dm_call_request_migrations = call_requests.len();
    for call in call_requests {
        ctx.db.dm_call_request().call_id().delete(call.call_id);
        ctx.db.dm_call_request().insert(DmCallRequest {
            caller_identity: if call.caller_identity == old_identity {
                new_identity
            } else {
                call.caller_identity
            },
            callee_identity: if call.callee_identity == old_identity {
                new_identity
            } else {
                call.callee_identity
            },
            ..call
        });
    }

    // Cascade: VoiceState
    if let Some(vs) = ctx.db.voice_state().identity().find(old_identity) {
        ctx.db.voice_state().identity().delete(old_identity);
        ctx.db.voice_state().insert(VoiceState {
            identity: new_identity,
            ..vs
        });
    }

    // Cascade: RtcSignal (sender + recipient)
    let sigs: Vec<_> = ctx
        .db
        .rtc_signal()
        .iter()
        .filter(|s| s.sender_identity == old_identity || s.recipient_identity == old_identity)
        .collect();
    for s in sigs {
        ctx.db.rtc_signal().signal_id().delete(s.signal_id);
        ctx.db.rtc_signal().insert(RtcSignal {
            sender_identity: if s.sender_identity == old_identity {
                new_identity
            } else {
                s.sender_identity
            },
            recipient_identity: if s.recipient_identity == old_identity {
                new_identity
            } else {
                s.recipient_identity
            },
            ..s
        });
    }

    // Cascade: Reaction (reactor_identity)
    let reacts: Vec<_> = ctx
        .db
        .reaction()
        .reaction_by_reactor_identity()
        .filter(&old_identity)
        .collect();
    for r in reacts {
        ctx.db.reaction().reaction_id().delete(r.reaction_id);
        ctx.db.reaction().insert(Reaction {
            reactor_identity: new_identity,
            ..r
        });
    }

    log::info!(
        "User '{}' identity transferred from {:?} to {:?} (presence_state_migrations={}, presence_offline_jobs_canceled={}, dm_call_request_migrations={})",
        username,
        old_identity,
        new_identity,
        presence_state_migrations,
        canceled_offline_jobs,
        dm_call_request_migrations,
    );
    Ok(())
}

#[spacetimedb::view(accessor = my_profile, public)]
pub fn my_profile(ctx: &ViewContext) -> Vec<User> {
    let who = ctx.sender();
    ctx.db.user().identity().find(who).into_iter().collect()
}

#[spacetimedb::view(accessor = my_visible_users, public)]
pub fn my_visible_users(ctx: &ViewContext) -> Vec<User> {
    let who = ctx.sender();
    let mut visible_identities = vec![who];

    for friendship in ctx.db.friend().friend_by_identity_low().filter(&who) {
        if !visible_identities
            .iter()
            .any(|identity| identity == &friendship.identity_high)
        {
            visible_identities.push(friendship.identity_high);
        }
    }

    for friendship in ctx.db.friend().friend_by_identity_high().filter(&who) {
        if !visible_identities
            .iter()
            .any(|identity| identity == &friendship.identity_low)
        {
            visible_identities.push(friendship.identity_low);
        }
    }

    let my_guild_ids: Vec<u64> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&who)
        .map(|member| member.guild_id)
        .collect();

    for guild_id in my_guild_ids {
        for member in ctx.db.guild_member().guild_id().filter(guild_id) {
            if !visible_identities
                .iter()
                .any(|identity| identity == &member.identity)
            {
                visible_identities.push(member.identity);
            }
        }
    }

    visible_identities
        .iter()
        .filter_map(|id| ctx.db.user().identity().find(id))
        .collect()
}
