use crate::{ChannelType, MemberRole, RtcSignalType, UserStatus};
use spacetimedb::{Identity, Timestamp};

/// Registered user profile. Upserted on connect.
#[spacetimedb::table(accessor = user)]
#[derive(Clone)]
pub struct User {
    #[primary_key]
    pub identity: Identity,
    #[unique]
    pub username: String,
    pub display_name: String,
    pub avatar_bytes: Option<Vec<u8>>, // small avatars only (≤100KB)
    pub status: UserStatus,
    pub created_at: Timestamp,
    pub bio: Option<String>,
    pub profile_color: Option<String>,
}

/// A guild (server/community).
#[spacetimedb::table(accessor = guild)]
#[derive(Clone)]
pub struct Guild {
    #[primary_key]
    #[auto_inc]
    pub guild_id: u64,
    pub name: String,
    pub owner_identity: Identity,
    pub created_at: Timestamp,
}

/// Guild membership record.
/// Index on `guild_id` to find all members of a guild.
/// Index on `identity` to find all guilds a user belongs to.
#[spacetimedb::table(accessor = guild_member)]
#[derive(Clone)]
pub struct GuildMember {
    #[primary_key]
    #[auto_inc]
    pub id: u64,
    #[index(btree)]
    pub guild_id: u64,
    #[index(btree)]
    pub identity: Identity,
    pub nickname: Option<String>,
    pub role: MemberRole,
    pub joined_at: Timestamp,
}

/// A pending guild invite.
#[spacetimedb::table(accessor = guild_invite, public)]
#[derive(Clone)]
pub struct GuildInvite {
    #[primary_key]
    #[auto_inc]
    pub invite_id: u64,
    #[index(btree)]
    pub guild_id: u64,
    pub inviter_identity: Identity,
    #[index(btree)]
    pub invitee_identity: Identity,
    pub created_at: Timestamp,
}

/// A channel within a guild (text, voice, or announcement).
#[spacetimedb::table(accessor = channel)]
#[derive(Clone)]
pub struct Channel {
    #[primary_key]
    #[auto_inc]
    pub channel_id: u64,
    #[index(btree)]
    pub guild_id: u64,
    pub name: String,
    pub channel_type: ChannelType,
    pub position: u32,
    pub topic: Option<String>,
    pub created_at: Timestamp,
}

/// A text message sent in a channel.
/// Soft-deleted: `is_deleted = true` hides content rather than removing the row.
#[spacetimedb::table(accessor = message)]
#[derive(Clone)]
pub struct Message {
    #[primary_key]
    #[auto_inc]
    pub message_id: u64,
    #[index(btree)]
    pub channel_id: u64,
    pub author_identity: Identity,
    pub content: String,
    pub sent_at: Timestamp,
    pub edited_at: Option<Timestamp>,
    pub is_deleted: bool,
    pub reply_to: Option<u64>, // message_id being replied to
}

/// A reaction applied to a guild text message.
#[spacetimedb::table(
    accessor = reaction,
    index(
        name = "reaction_by_message_id",
        accessor = reaction_by_message_id,
        btree(columns = [message_id])
    ),
    index(
        name = "reaction_by_channel_id",
        accessor = reaction_by_channel_id,
        btree(columns = [channel_id])
    ),
    index(
        name = "reaction_by_reactor_identity",
        accessor = reaction_by_reactor_identity,
        btree(columns = [reactor_identity])
    )
)]
#[derive(Clone)]
pub struct Reaction {
    #[primary_key]
    #[auto_inc]
    pub reaction_id: u64,
    pub message_id: u64,
    pub channel_id: u64,
    pub reactor_identity: Identity,
    pub emoji: String,
    pub reacted_at: Timestamp,
}

/// A reaction applied to a DM message.
#[spacetimedb::table(
    accessor = dm_reaction,
    public,
    index(
        name = "dm_reaction_by_dm_message_id",
        accessor = dm_reaction_by_dm_message_id,
        btree(columns = [dm_message_id])
    ),
    index(
        name = "dm_reaction_by_dm_channel_id",
        accessor = dm_reaction_by_dm_channel_id,
        btree(columns = [dm_channel_id])
    ),
    index(
        name = "dm_reaction_by_reactor_identity",
        accessor = dm_reaction_by_reactor_identity,
        btree(columns = [reactor_identity])
    )
)]
#[derive(Clone)]
pub struct DmReaction {
    #[primary_key]
    #[auto_inc]
    pub dm_reaction_id: u64,
    pub dm_message_id: u64,
    pub dm_channel_id: u64,
    pub reactor_identity: Identity,
    pub emoji: String,
    pub reacted_at: Timestamp,
}

/// A direct-message channel between participants.
#[spacetimedb::table(
    accessor = dm_channel,
    index(
        name = "dm_channel_by_created_by_identity",
        accessor = dm_channel_by_created_by_identity,
        btree(columns = [created_by_identity])
    )
)]
#[derive(Clone)]
pub struct DmChannel {
    #[primary_key]
    #[auto_inc]
    pub dm_channel_id: u64,
    pub created_by_identity: Identity,
    pub created_at: Timestamp,
}

/// Participant membership in a DM channel.
#[spacetimedb::table(
    accessor = dm_participant,
    index(
        name = "dm_participant_by_dm_channel_id",
        accessor = dm_participant_by_dm_channel_id,
        btree(columns = [dm_channel_id])
    ),
    index(
        name = "dm_participant_by_identity",
        accessor = dm_participant_by_identity,
        btree(columns = [identity])
    ),
    index(
        name = "dm_participant_by_channel_identity",
        accessor = dm_participant_by_channel_identity,
        btree(columns = [dm_channel_id, identity])
    )
)]
#[derive(Clone)]
pub struct DmParticipant {
    #[primary_key]
    #[auto_inc]
    pub dm_participant_id: u64,
    pub dm_channel_id: u64,
    pub identity: Identity,
    pub joined_at: Timestamp,
}

/// A text message sent in a DM channel.
#[spacetimedb::table(
    accessor = dm_message,
    index(
        name = "dm_message_by_dm_channel_id",
        accessor = dm_message_by_dm_channel_id,
        btree(columns = [dm_channel_id])
    ),
    index(
        name = "dm_message_by_author_identity",
        accessor = dm_message_by_author_identity,
        btree(columns = [author_identity])
    )
)]
#[derive(Clone)]
pub struct DmMessage {
    #[primary_key]
    #[auto_inc]
    pub dm_message_id: u64,
    pub dm_channel_id: u64,
    pub author_identity: Identity,
    pub content: String,
    pub sent_at: Timestamp,
    pub edited_at: Option<Timestamp>,
    pub is_deleted: bool,
    pub reply_to: Option<u64>,
}

/// Pending friend request from one identity to another.
#[spacetimedb::table(
    accessor = friend_request,
    index(
        name = "friend_request_by_sender_identity",
        accessor = friend_request_by_sender_identity,
        btree(columns = [sender_identity])
    ),
    index(
        name = "friend_request_by_recipient_identity",
        accessor = friend_request_by_recipient_identity,
        btree(columns = [recipient_identity])
    )
)]
#[derive(Clone)]
pub struct FriendRequest {
    #[primary_key]
    #[auto_inc]
    pub friend_request_id: u64,
    pub sender_identity: Identity,
    pub recipient_identity: Identity,
    #[unique]
    pub request_key: String,
    pub created_at: Timestamp,
}

/// Accepted friendship using a canonical identity pair for uniqueness.
#[spacetimedb::table(
    accessor = friend,
    index(
        name = "friend_by_identity_low",
        accessor = friend_by_identity_low,
        btree(columns = [identity_low])
    ),
    index(
        name = "friend_by_identity_high",
        accessor = friend_by_identity_high,
        btree(columns = [identity_high])
    )
)]
#[derive(Clone)]
pub struct Friend {
    #[primary_key]
    #[auto_inc]
    pub friend_id: u64,
    pub identity_low: Identity,
    pub identity_high: Identity,
    #[unique]
    pub friendship_key: String,
    pub created_at: Timestamp,
}

/// Voice channel presence state per user.
#[spacetimedb::table(accessor = voice_state)]
#[derive(Clone)]
pub struct VoiceState {
    #[primary_key]
    pub identity: Identity,
    #[index(btree)]
    pub guild_id: u64,
    #[index(btree)]
    pub channel_id: u64,
    pub is_muted: bool,
    pub is_deafened: bool,
    pub is_streaming: bool,
    pub joined_at: Timestamp,
}

/// Ephemeral WebRTC signaling messages addressed to a recipient.
/// Rows are deleted by recipient ack, or cleaned up on disconnect.
#[spacetimedb::table(accessor = rtc_signal)]
#[derive(Clone)]
pub struct RtcSignal {
    #[primary_key]
    #[auto_inc]
    pub signal_id: u64,
    #[index(btree)]
    pub guild_id: u64,
    #[index(btree)]
    pub channel_id: u64,
    #[index(btree)]
    pub sender_identity: Identity,
    #[index(btree)]
    pub recipient_identity: Identity,
    pub signal_type: RtcSignalType,
    pub payload: String,
    pub sent_at: Timestamp,
}

/// Pending DM voice call request.
#[spacetimedb::table(accessor = dm_call_request, public)]
#[derive(Clone)]
pub struct DmCallRequest {
    #[primary_key]
    #[auto_inc]
    pub call_id: u64,
    pub dm_channel_id: u64,
    #[index(btree)]
    pub caller_identity: Identity,
    #[index(btree)]
    pub callee_identity: Identity,
    pub created_at: Timestamp,
}
