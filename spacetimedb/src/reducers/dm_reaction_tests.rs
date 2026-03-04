use super::{dm::dedup_participants_including_caller, reaction::normalize_and_validate_emoji};

#[test]
fn emoji_validation_rejects_empty_after_trim() {
    let result = normalize_and_validate_emoji("   ".to_string());
    assert!(result.is_err());
}

#[test]
fn emoji_validation_accepts_exact_max_chars() {
    let emoji = "a".repeat(64);
    let result = normalize_and_validate_emoji(emoji.clone());
    assert_eq!(result, Ok(emoji));
}

#[test]
fn emoji_validation_rejects_over_max_chars() {
    let emoji = "🙂".repeat(65);
    let result = normalize_and_validate_emoji(emoji);
    assert!(result.is_err());
}

#[test]
fn participant_dedup_keeps_caller_first_and_unique_order() {
    let deduped = dedup_participants_including_caller(10_u64, vec![10_u64, 20, 20, 30, 10, 30]);
    assert_eq!(deduped, vec![10, 20, 30]);
}

#[test]
fn participant_dedup_includes_caller_when_no_participants() {
    let deduped = dedup_participants_including_caller(42_u64, Vec::<u64>::new());
    assert_eq!(deduped, vec![42]);
}

#[test]
fn participant_dedup_preserves_first_seen_peer_order() {
    let deduped = dedup_participants_including_caller(7_u64, vec![30_u64, 20, 30, 10, 20, 10]);
    assert_eq!(deduped, vec![7, 30, 20, 10]);
}

#[test]
fn participant_dedup_with_only_caller_duplicates_returns_single_caller() {
    let deduped = dedup_participants_including_caller(99_u64, vec![99_u64, 99, 99]);
    assert_eq!(deduped, vec![99]);
}
