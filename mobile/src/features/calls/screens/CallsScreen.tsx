import { PlaceholderScreen } from '../../../shared/ui'

export function CallsScreen() {
  return (
    <PlaceholderScreen
      eyebrow="CALLS"
      title="Call hub placeholder"
      description="This screen establishes a dedicated destination for call state, ringing flows, and device controls once realtime calling work is ready on mobile."
      highlights={[
        'Keep room for active-call state, recent sessions, and permissions handling.',
        'Avoid coupling this shell to transport or signaling code until those APIs are stable.',
        'Preserve a simple navigation contract for future voice and video flows.',
      ]}
    />
  )
}
