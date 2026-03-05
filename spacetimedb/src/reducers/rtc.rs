use spacetimedb::{Identity, ReducerContext, Table, ViewContext};

use crate::{
    helpers::{
        cleanup_stale_rtc_signals, find_member, pending_rtc_signals_within_limit, require_role,
        rtc_signal_within_rate_limit_window, sender_rtc_signals_within_limit,
        timestamp_to_unix_micros, validate_signal_payload, MAX_PENDING_RTC_SIGNALS_PER_RECIPIENT,
        MAX_RTC_SIGNALS_PER_SENDER_WINDOW, RTC_SIGNAL_RATE_LIMIT_WINDOW_SECS,
    },
    tables::{
        channel, channel__view, dm_channel, dm_participant, dm_participant__view,
        guild_member__view, rtc_signal, rtc_signal__view, user, voice_state, voice_state__view,
        RtcSignal, VoiceState,
    },
    types::{ChannelType, MemberRole, RtcSignalType},
};

/// Join or switch to a voice channel.
#[spacetimedb::reducer]
pub fn join_voice_channel(ctx: &ReducerContext, channel_id: u64) -> Result<(), String> {
    let channel = ctx
        .db
        .channel()
        .channel_id()
        .find(channel_id)
        .ok_or("Channel not found")?;

    if channel.channel_type != ChannelType::Voice {
        return Err("Channel is not a voice channel".into());
    }

    require_role(ctx, channel.guild_id, MemberRole::Member)?;

    let who = ctx.sender();
    if let Some(mut state) = ctx.db.voice_state().identity().find(who) {
        state.guild_id = channel.guild_id;
        state.channel_id = channel_id;
        state.joined_at = ctx.timestamp;
        ctx.db.voice_state().identity().update(state);
    } else {
        ctx.db.voice_state().insert(VoiceState {
            identity: who,
            guild_id: channel.guild_id,
            channel_id,
            is_muted: false,
            is_deafened: false,
            is_streaming: false,
            joined_at: ctx.timestamp,
        });
    }

    Ok(())
}

/// Leave current voice channel.
#[spacetimedb::reducer]
pub fn leave_voice_channel(ctx: &ReducerContext) -> Result<(), String> {
    let who = ctx.sender();

    // Just delete — if no voice state exists, this is a no-op which is fine
    ctx.db.voice_state().identity().delete(who);

    Ok(())
}

/// Update mute/deafen/stream flags for current voice state.
#[spacetimedb::reducer]
pub fn update_voice_state(
    ctx: &ReducerContext,
    is_muted: bool,
    is_deafened: bool,
    is_streaming: bool,
) -> Result<(), String> {
    let who = ctx.sender();
    let mut state = ctx
        .db
        .voice_state()
        .identity()
        .find(who)
        .ok_or("You are not in a voice channel")?;

    state.is_muted = is_muted;
    state.is_deafened = is_deafened;
    state.is_streaming = is_streaming;
    ctx.db.voice_state().identity().update(state);
    Ok(())
}

/// Join a DM voice call. Leaves any existing voice state (guild or DM).
#[spacetimedb::reducer]
pub fn join_voice_dm(ctx: &ReducerContext, dm_channel_id: u64) -> Result<(), String> {
    // Verify user is registered
    ctx.db
        .user()
        .identity()
        .find(ctx.sender())
        .ok_or("Not registered")?;

    // Verify DM channel exists
    ctx.db
        .dm_channel()
        .dm_channel_id()
        .find(dm_channel_id)
        .ok_or("DM channel not found")?;

    // Verify caller is a participant
    let is_participant = ctx
        .db
        .dm_participant()
        .dm_participant_by_dm_channel_id()
        .filter(dm_channel_id)
        .any(|p| p.identity == ctx.sender());
    if !is_participant {
        return Err("Not a participant of this DM channel".into());
    }

    // Leave any existing voice state (guild or DM)
    let who = ctx.sender();
    if ctx.db.voice_state().identity().find(who).is_some() {
        ctx.db.voice_state().identity().delete(who);
    }

    // Create voice state with guild_id=0 meaning DM
    ctx.db.voice_state().insert(VoiceState {
        identity: who,
        guild_id: 0, // Sentinel: 0 = DM voice
        channel_id: dm_channel_id,
        is_muted: false,
        is_deafened: false,
        is_streaming: false,
        joined_at: ctx.timestamp,
    });

    Ok(())
}

/// Send an RTC signaling message to a recipient in a DM voice call.
#[spacetimedb::reducer]
pub fn send_dm_rtc_signal(
    ctx: &ReducerContext,
    dm_channel_id: u64,
    recipient_identity: Identity,
    signal_type: RtcSignalType,
    payload: String,
) -> Result<(), String> {
    let sender_identity = ctx.sender();

    cleanup_stale_rtc_signals(ctx);
    let now_micros = timestamp_to_unix_micros(&ctx.timestamp);

    if sender_identity == recipient_identity {
        return Err("Cannot send signaling message to yourself".into());
    }

    validate_signal_payload(&signal_type, &payload)?;

    // Verify DM channel exists
    ctx.db
        .dm_channel()
        .dm_channel_id()
        .find(dm_channel_id)
        .ok_or("DM channel not found")?;

    // Verify both are participants
    let sender_is_participant = ctx
        .db
        .dm_participant()
        .dm_participant_by_dm_channel_id()
        .filter(dm_channel_id)
        .any(|p| p.identity == sender_identity);
    let recipient_is_participant = ctx
        .db
        .dm_participant()
        .dm_participant_by_dm_channel_id()
        .filter(dm_channel_id)
        .any(|p| p.identity == recipient_identity);
    if !sender_is_participant || !recipient_is_participant {
        return Err("Both users must be DM participants".into());
    }

    // Verify both are in voice for this DM channel
    let sender_in_voice = ctx
        .db
        .voice_state()
        .identity()
        .find(sender_identity)
        .map(|vs| vs.guild_id == 0 && vs.channel_id == dm_channel_id)
        .unwrap_or(false);
    let recipient_in_voice = ctx
        .db
        .voice_state()
        .identity()
        .find(recipient_identity)
        .map(|vs| vs.guild_id == 0 && vs.channel_id == dm_channel_id)
        .unwrap_or(false);
    if !sender_in_voice || !recipient_in_voice {
        return Err("Both users must be in the DM voice call".into());
    }

    // Rate limiting: sender window
    let recent_from_sender = ctx
        .db
        .rtc_signal()
        .sender_identity()
        .filter(&sender_identity)
        .filter(|signal| {
            rtc_signal_within_rate_limit_window(
                now_micros,
                timestamp_to_unix_micros(&signal.sent_at),
            )
        })
        .count();
    if !sender_rtc_signals_within_limit(recent_from_sender) {
        return Err(format!(
            "Sender is rate-limited: too many signals in {}s window (limit {})",
            RTC_SIGNAL_RATE_LIMIT_WINDOW_SECS, MAX_RTC_SIGNALS_PER_SENDER_WINDOW
        ));
    }

    // Rate limiting: pending for recipient
    let pending_for_recipient = ctx
        .db
        .rtc_signal()
        .recipient_identity()
        .filter(&recipient_identity)
        .count();
    if !pending_rtc_signals_within_limit(pending_for_recipient) {
        return Err(format!(
            "Recipient has too many pending signals (limit {})",
            MAX_PENDING_RTC_SIGNALS_PER_RECIPIENT
        ));
    }

    ctx.db.rtc_signal().insert(RtcSignal {
        signal_id: 0,
        guild_id: 0, // Sentinel: 0 = DM voice
        channel_id: dm_channel_id,
        sender_identity,
        recipient_identity,
        signal_type,
        payload,
        sent_at: ctx.timestamp,
    });

    Ok(())
}

/// Send an RTC signaling message to a recipient in the same guild/channel context.
#[spacetimedb::reducer]
pub fn send_rtc_signal(
    ctx: &ReducerContext,
    channel_id: u64,
    recipient_identity: Identity,
    signal_type: RtcSignalType,
    payload: String,
) -> Result<(), String> {
    let sender_identity = ctx.sender();

    cleanup_stale_rtc_signals(ctx);
    let now_micros = timestamp_to_unix_micros(&ctx.timestamp);

    if recipient_identity == sender_identity {
        return Err("Cannot send signaling message to yourself".into());
    }

    validate_signal_payload(&signal_type, &payload)?;

    let channel = ctx
        .db
        .channel()
        .channel_id()
        .find(channel_id)
        .ok_or("Channel not found")?;

    if channel.channel_type != ChannelType::Voice {
        return Err("RTC signaling is only allowed for voice channels".into());
    }

    require_role(ctx, channel.guild_id, MemberRole::Member)?;
    if find_member(ctx, channel.guild_id, &recipient_identity).is_none() {
        return Err("Recipient is not a member of this guild".into());
    }

    let sender_voice = ctx
        .db
        .voice_state()
        .identity()
        .find(sender_identity)
        .ok_or("Join the voice channel before sending RTC signals")?;
    if sender_voice.guild_id != channel.guild_id || sender_voice.channel_id != channel_id {
        return Err("Join the target voice channel before sending RTC signals".into());
    }

    let recipient_voice = ctx
        .db
        .voice_state()
        .identity()
        .find(recipient_identity)
        .ok_or("Recipient is not in this voice channel")?;
    if recipient_voice.guild_id != channel.guild_id || recipient_voice.channel_id != channel_id {
        return Err("Recipient is not in this voice channel".into());
    }

    let recent_from_sender = ctx
        .db
        .rtc_signal()
        .sender_identity()
        .filter(&sender_identity)
        .filter(|signal| {
            rtc_signal_within_rate_limit_window(
                now_micros,
                timestamp_to_unix_micros(&signal.sent_at),
            )
        })
        .count();
    if !sender_rtc_signals_within_limit(recent_from_sender) {
        return Err(format!(
            "Sender is rate-limited: too many signals in {}s window (limit {})",
            RTC_SIGNAL_RATE_LIMIT_WINDOW_SECS, MAX_RTC_SIGNALS_PER_SENDER_WINDOW
        ));
    }

    let pending_for_recipient = ctx
        .db
        .rtc_signal()
        .recipient_identity()
        .filter(&recipient_identity)
        .count();
    if !pending_rtc_signals_within_limit(pending_for_recipient) {
        return Err(format!(
            "Recipient has too many pending signals (limit {})",
            MAX_PENDING_RTC_SIGNALS_PER_RECIPIENT
        ));
    }

    ctx.db.rtc_signal().insert(RtcSignal {
        signal_id: 0,
        guild_id: channel.guild_id,
        channel_id,
        sender_identity,
        recipient_identity,
        signal_type,
        payload,
        sent_at: ctx.timestamp,
    });

    Ok(())
}

/// Acknowledge and delete a signaling message. Only recipient may ack/delete.
#[spacetimedb::reducer]
pub fn ack_rtc_signal(ctx: &ReducerContext, signal_id: u64) -> Result<(), String> {
    let who = ctx.sender();
    let signal = ctx
        .db
        .rtc_signal()
        .signal_id()
        .find(signal_id)
        .ok_or("RTC signal not found")?;

    if signal.recipient_identity != who {
        return Err("Only the recipient can ack/delete this signaling message".into());
    }

    ctx.db.rtc_signal().signal_id().delete(signal_id);
    cleanup_stale_rtc_signals(ctx);
    Ok(())
}

#[spacetimedb::reducer]
pub fn delete_rtc_signal(ctx: &ReducerContext, signal_id: u64) -> Result<(), String> {
    ack_rtc_signal(ctx, signal_id)
}

#[spacetimedb::view(accessor = my_rtc_signals, public)]
pub fn my_rtc_signals(ctx: &ViewContext) -> Vec<RtcSignal> {
    let who = ctx.sender();

    let mut signals: Vec<RtcSignal> = ctx
        .db
        .rtc_signal()
        .recipient_identity()
        .filter(&who)
        .collect();
    signals.extend(ctx.db.rtc_signal().sender_identity().filter(&who));
    signals
}

#[spacetimedb::view(accessor = my_voice_states, public)]
pub fn my_voice_states(ctx: &ViewContext) -> Vec<VoiceState> {
    let who = ctx.sender();
    let guild_ids: std::collections::BTreeSet<u64> = ctx
        .db
        .guild_member()
        .identity()
        .filter(&who)
        .map(|member| member.guild_id)
        .collect();

    let mut voice_states = Vec::new();

    // Guild voice states
    for guild_id in guild_ids {
        for channel in ctx.db.channel().guild_id().filter(guild_id) {
            if channel.channel_type == ChannelType::Voice {
                voice_states.extend(
                    ctx.db
                        .voice_state()
                        .channel_id()
                        .filter(channel.channel_id)
                        .filter(|state| state.guild_id == guild_id),
                );
            }
        }
    }

    // DM voice states: include voice states for DM channels the caller participates in
    let dm_channel_ids: Vec<u64> = ctx
        .db
        .dm_participant()
        .dm_participant_by_identity()
        .filter(&who)
        .map(|p| p.dm_channel_id)
        .collect();
    for dm_channel_id in dm_channel_ids {
        voice_states.extend(
            ctx.db
                .voice_state()
                .channel_id()
                .filter(dm_channel_id)
                .filter(|state| state.guild_id == 0),
        );
    }

    voice_states
}
