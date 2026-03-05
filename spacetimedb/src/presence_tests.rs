use crate::{
    restore_status_after_reconnect, should_apply_offline_transition, should_emit_presence_change,
    snapshot_status_before_disconnect, status_after_login_identity_transfer, UserStatus,
};

#[test]
fn reconnect_restores_previous_non_offline_status_when_current_is_offline() {
    let restored =
        restore_status_after_reconnect(&UserStatus::Offline, Some(&UserStatus::DoNotDisturb));
    assert_eq!(restored, Some(UserStatus::DoNotDisturb));
}

#[test]
fn reconnect_does_not_restore_when_current_is_offline_and_no_previous_status() {
    let restored = restore_status_after_reconnect(&UserStatus::Offline, None);
    assert_eq!(restored, None);
}

#[test]
fn disconnect_snapshot_clears_for_manual_offline_status() {
    let snapshot = snapshot_status_before_disconnect(&UserStatus::Offline);
    assert_eq!(snapshot, None);
}

#[test]
fn disconnect_snapshot_preserves_non_offline_status() {
    let snapshot = snapshot_status_before_disconnect(&UserStatus::DoNotDisturb);
    assert_eq!(snapshot, Some(UserStatus::DoNotDisturb));
}

#[test]
fn reconnect_does_not_override_active_manual_status() {
    let restored = restore_status_after_reconnect(&UserStatus::Away, Some(&UserStatus::Online));
    assert_eq!(restored, None);
}

#[test]
fn offline_transition_runs_only_for_zero_sessions_and_matching_generation() {
    assert!(should_apply_offline_transition(0, 5, 5));
    assert!(!should_apply_offline_transition(1, 5, 5));
    assert!(!should_apply_offline_transition(0, 6, 5));
}

#[test]
fn login_identity_transfer_restores_new_identity_snapshot_before_old_snapshot() {
    let reconciled = status_after_login_identity_transfer(
        &UserStatus::Offline,
        Some(&UserStatus::DoNotDisturb),
        Some(&UserStatus::Away),
    );
    assert_eq!(reconciled, Some(UserStatus::DoNotDisturb));
}

#[test]
fn login_identity_transfer_restores_old_identity_snapshot_when_new_missing() {
    let reconciled =
        status_after_login_identity_transfer(&UserStatus::Offline, None, Some(&UserStatus::Away));
    assert_eq!(reconciled, Some(UserStatus::Away));
}

#[test]
fn login_identity_transfer_forces_online_when_offline_without_snapshots() {
    let reconciled = status_after_login_identity_transfer(&UserStatus::Offline, None, None);
    assert_eq!(reconciled, Some(UserStatus::Online));
}

#[test]
fn login_identity_transfer_does_not_override_non_offline_status() {
    let reconciled = status_after_login_identity_transfer(
        &UserStatus::Online,
        Some(&UserStatus::DoNotDisturb),
        Some(&UserStatus::Away),
    );
    assert_eq!(reconciled, None);
}

#[test]
fn status_change_emits_presence_event_when_new_status_differs() {
    assert!(should_emit_presence_change(
        &UserStatus::Online,
        &UserStatus::DoNotDisturb
    ));
}

#[test]
fn status_change_does_not_emit_presence_event_when_status_is_unchanged() {
    assert!(!should_emit_presence_change(
        &UserStatus::Away,
        &UserStatus::Away
    ));
}
