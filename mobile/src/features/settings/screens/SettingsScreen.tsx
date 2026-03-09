import { PlaceholderScreen } from '../../../shared/ui'

export function SettingsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="SETTINGS"
      title="Preferences shell"
      description="This screen is the future home for profile preferences, notifications, appearance, and debugging tools. The shell keeps those concerns isolated from other app flows."
      highlights={[
        'Add account and profile controls here once authentication is wired in.',
        'Group device, notification, and accessibility options behind stable sections.',
        'Keep diagnostics and developer actions separated from user-facing preferences.',
      ]}
    />
  )
}
