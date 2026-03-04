use crate::tables::{guild_member, message, reaction, rtc_signal, voice_state, GuildMember};
use crate::types::{MemberRole, RtcSignalType};
use spacetimedb::{Identity, ReducerContext, Table, Timestamp};

pub(crate) const MAX_PENDING_RTC_SIGNALS_PER_RECIPIENT: usize = 256;
pub(crate) const MAX_RTC_SIGNALS_PER_SENDER_WINDOW: usize = 64;
pub(crate) const MICROS_PER_SECOND: u128 = 1_000_000;
pub(crate) const RTC_SIGNAL_RATE_LIMIT_WINDOW_SECS: u64 = 3;
pub(crate) const RTC_SIGNAL_RATE_LIMIT_WINDOW_MICROS: u128 =
    (RTC_SIGNAL_RATE_LIMIT_WINDOW_SECS as u128) * MICROS_PER_SECOND;
pub(crate) const RTC_SIGNAL_STALE_AFTER_SECS: u64 = 30;
pub(crate) const RTC_SIGNAL_STALE_AFTER_MICROS: u128 =
    (RTC_SIGNAL_STALE_AFTER_SECS as u128) * MICROS_PER_SECOND;

/// Find a user's GuildMember record for a specific guild.
pub(crate) fn find_member(
    ctx: &ReducerContext,
    guild_id: u64,
    identity: &Identity,
) -> Option<GuildMember> {
    ctx.db
        .guild_member()
        .guild_id()
        .filter(guild_id)
        .find(|m| &m.identity == identity)
}

/// Assert the caller is a member of a guild with at least the given role.
pub(crate) fn require_role(
    ctx: &ReducerContext,
    guild_id: u64,
    min_role: MemberRole,
) -> Result<GuildMember, String> {
    let caller = ctx.sender();
    let member = find_member(ctx, guild_id, &caller)
        .ok_or_else(|| format!("You are not a member of guild {}", guild_id))?;
    if member.role >= min_role {
        Ok(member)
    } else {
        Err(format!(
            "Insufficient permissions: requires {:?} or higher",
            min_role
        ))
    }
}

pub(crate) fn validate_signal_payload(
    signal_type: &RtcSignalType,
    payload: &str,
) -> Result<(), String> {
    const MAX_SIGNAL_PAYLOAD_BYTES: usize = 32_768;

    if payload.len() > MAX_SIGNAL_PAYLOAD_BYTES {
        return Err(format!(
            "Signal payload must be ≤ {} bytes",
            MAX_SIGNAL_PAYLOAD_BYTES
        ));
    }

    if *signal_type != RtcSignalType::Bye && payload.trim().is_empty() {
        return Err("Signal payload cannot be empty for offer/answer/ice".into());
    }

    Ok(())
}

pub(crate) fn pending_rtc_signals_within_limit(pending_count: usize) -> bool {
    pending_count < MAX_PENDING_RTC_SIGNALS_PER_RECIPIENT
}

pub(crate) fn sender_rtc_signals_within_limit(pending_count: usize) -> bool {
    pending_count < MAX_RTC_SIGNALS_PER_SENDER_WINDOW
}

pub(crate) fn timestamp_to_unix_micros(timestamp: &Timestamp) -> u128 {
    timestamp
        .to_duration_since_unix_epoch()
        .unwrap_or_default()
        .as_micros()
}

pub(crate) fn rtc_signal_is_stale(now_micros: u128, sent_micros: u128) -> bool {
    now_micros.saturating_sub(sent_micros) > RTC_SIGNAL_STALE_AFTER_MICROS
}

pub(crate) fn rtc_signal_within_rate_limit_window(now_micros: u128, sent_micros: u128) -> bool {
    now_micros.saturating_sub(sent_micros) <= RTC_SIGNAL_RATE_LIMIT_WINDOW_MICROS
}

pub(crate) fn cleanup_stale_rtc_signals(ctx: &ReducerContext) {
    let now_micros = timestamp_to_unix_micros(&ctx.timestamp);
    let stale_signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .iter()
        .filter(|signal| rtc_signal_is_stale(now_micros, timestamp_to_unix_micros(&signal.sent_at)))
        .map(|signal| signal.signal_id)
        .collect();

    for signal_id in stale_signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }
}

/// Delete all resources associated with a channel: reactions, messages,
/// voice states, and RTC signals. Does NOT delete the channel row itself.
pub(crate) fn delete_channel_cascade(ctx: &ReducerContext, channel_id: u64) {
    // Delete all reactions in this channel
    let reaction_ids: Vec<u64> = ctx
        .db
        .reaction()
        .reaction_by_channel_id()
        .filter(channel_id)
        .map(|r| r.reaction_id)
        .collect();
    for reaction_id in reaction_ids {
        ctx.db.reaction().reaction_id().delete(reaction_id);
    }

    // Delete all messages in this channel
    let message_ids: Vec<u64> = ctx
        .db
        .message()
        .channel_id()
        .filter(channel_id)
        .map(|m| m.message_id)
        .collect();
    for message_id in message_ids {
        ctx.db.message().message_id().delete(message_id);
    }

    // Clean up voice states for this channel
    let voice_identities: Vec<Identity> = ctx
        .db
        .voice_state()
        .channel_id()
        .filter(channel_id)
        .map(|vs| vs.identity)
        .collect();
    for identity in voice_identities {
        ctx.db.voice_state().identity().delete(identity);
    }

    // Clean up RTC signals for this channel
    let signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .channel_id()
        .filter(channel_id)
        .map(|s| s.signal_id)
        .collect();
    for signal_id in signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }
}

pub(crate) fn cleanup_member_voice_and_signals_in_guild(
    ctx: &ReducerContext,
    guild_id: u64,
    identity: &Identity,
) {
    if let Some(state) = ctx.db.voice_state().identity().find(identity) {
        if state.guild_id == guild_id {
            ctx.db.voice_state().identity().delete(identity);
        }
    }

    let incoming_signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .recipient_identity()
        .filter(identity)
        .filter(|row| row.guild_id == guild_id)
        .map(|row| row.signal_id)
        .collect();
    for signal_id in incoming_signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }

    let outgoing_signal_ids: Vec<u64> = ctx
        .db
        .rtc_signal()
        .sender_identity()
        .filter(identity)
        .filter(|row| row.guild_id == guild_id)
        .map(|row| row.signal_id)
        .collect();
    for signal_id in outgoing_signal_ids {
        ctx.db.rtc_signal().signal_id().delete(signal_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rtc_payload_requires_non_empty_for_offer() {
        let result = validate_signal_payload(&RtcSignalType::Offer, "");
        assert!(result.is_err());
    }

    #[test]
    fn rtc_payload_allows_empty_for_bye() {
        let result = validate_signal_payload(&RtcSignalType::Bye, "");
        assert!(result.is_ok());
    }

    #[test]
    fn rtc_payload_enforces_max_length() {
        let payload = "x".repeat(32_769);
        let result = validate_signal_payload(&RtcSignalType::IceCandidate, &payload);
        assert!(result.is_err());
    }

    #[test]
    fn pending_rtc_signals_guard_blocks_at_limit() {
        assert!(pending_rtc_signals_within_limit(255));
        assert!(!pending_rtc_signals_within_limit(256));
    }
}
