import { PlaceholderScreen } from '../../../shared/ui'
import { useAuth } from '../../auth'

export function HomeScreen() {
  const { session } = useAuth()

  const authSummary = session.status === 'signed-in'
    ? `Signed in as ${session.displayName}`
    : session.status === 'error'
      ? `Auth error: ${session.message}`
      : session.status === 'loading'
        ? 'Restoring mobile session…'
        : 'Auth bootstrap is ready for Expo integration.'

  return (
    <PlaceholderScreen
      eyebrow="STRING MOBILE"
      title="Home shell ready"
      description={`${authSummary} This top-level workspace will become the launch point for activity, guild context, and quick navigation as mobile features are added incrementally.`}
      highlights={[
        'Reserve space for high-level activity and presence summaries.',
        'Keep routing lightweight while backend subscriptions are still offline.',
        'Add feature widgets here only when their underlying data flows are ready.',
      ]}
    />
  )
}
