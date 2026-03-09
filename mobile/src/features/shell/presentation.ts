import type { PillVariant } from '../../shared/ui'
import type { ShellTabKey } from './types'

export type ShellActiveDetail =
  | null
  | { kind: 'guild'; title: string; subtitle: string; guildId?: string }
  | { kind: 'channel'; title: string; subtitle: string; channelId: string; channelName: string; guildName: string; guildId?: string }
  | { kind: 'dm'; conversationId: string; peerName: string }

export interface ShellBadge {
  label: string
  variant?: PillVariant
}

export interface ShellStat {
  label: string
  value: string
}

export interface ShellHeroPresentation {
  eyebrow: string
  title: string
  description: string
  stats: ShellStat[]
}

export interface ShellSectionPresentation {
  title: string
  subtitle: string
  contextLabel: string
  badges: ShellBadge[]
  hero: ShellHeroPresentation
}

export const SHELL_TAB_PRESENTATION: Record<ShellTabKey, ShellSectionPresentation> = {
  browse: {
    title: 'Browse',
    subtitle: 'Servers, channels, and navigation',
    contextLabel: 'Workspace navigation preview',
    badges: [
      { label: 'Navigation', variant: 'blue' },
      { label: 'Unread 3' },
    ],
    hero: {
      eyebrow: 'Jump back in',
      title: 'Everything you need to re-enter the workspace quickly',
      description: 'Keep the same server-first rhythm as the web phone layout with a stronger sense of current activity, quick destinations, and recent context.',
      stats: [
        { label: 'Joined servers', value: '2' },
        { label: 'Unread channels', value: '3' },
        { label: 'Live rooms', value: '1' },
      ],
    },
  },
  friends: {
    title: 'Friends',
    subtitle: 'Online friends, requests, and DMs',
    contextLabel: 'Social inbox snapshot',
    badges: [
      { label: 'Online now', variant: 'green' },
      { label: 'Pending 1' },
    ],
    hero: {
      eyebrow: 'Stay close',
      title: 'Your social feed feels active even before live presence lands',
      description: 'Surface who is around, what they are doing, and which direct messages are worth opening first.',
      stats: [
        { label: 'Reachable friends', value: '3' },
        { label: 'Pending requests', value: '2' },
        { label: 'Active threads', value: '4' },
      ],
    },
  },
  you: {
    title: 'You',
    subtitle: 'Profile, settings, and account controls',
    contextLabel: 'Account surface preview',
    badges: [
      { label: 'Signed in', variant: 'blue' },
      { label: 'Mobile shell' },
    ],
    hero: {
      eyebrow: 'Personalize',
      title: 'Account and app settings stay compact, readable, and phone-first',
      description: 'Profile identity, presence, and important preferences stay grouped into a single polished settings surface.',
      stats: [
        { label: 'Presence', value: 'Online' },
        { label: 'Theme', value: 'Dark' },
        { label: 'Shell status', value: 'Preview' },
      ],
    },
  },
}

export interface ShellHeaderContext {
  eyebrow: string
  title: string
  subtitle: string
  contextLabel: string
  badges: ShellBadge[]
}

interface BuildShellHeaderContextArgs {
  activeTab: ShellTabKey
  activeDetail: ShellActiveDetail
  displayName: string
}

export function buildShellHeaderContext({
  activeTab,
  activeDetail,
  displayName,
}: BuildShellHeaderContextArgs): ShellHeaderContext {
  if (!activeDetail) {
    const section = SHELL_TAB_PRESENTATION[activeTab]

    return {
      eyebrow: section.contextLabel,
      title: section.title,
      subtitle: section.subtitle,
      contextLabel: displayName,
      badges: section.badges,
    }
  }

  if (activeDetail.kind === 'dm') {
    return {
      eyebrow: 'Direct message',
      title: activeDetail.peerName,
      subtitle: 'Conversation detail, recent context, and quick replies stay in the same single-column flow.',
      contextLabel: 'DM preview',
      badges: [
        { label: '1:1 thread', variant: 'blue' },
        { label: 'Online', variant: 'green' },
      ],
    }
  }

  if (activeDetail.kind === 'guild') {
    return {
      eyebrow: 'Server overview',
      title: activeDetail.title,
      subtitle: activeDetail.subtitle,
      contextLabel: 'Community snapshot',
      badges: [
        { label: 'Server', variant: 'blue' },
        { label: 'Members live' },
      ],
    }
  }

  return {
    eyebrow: activeDetail.guildName.toUpperCase(),
    title: `/  # ${activeDetail.channelName}`,
    subtitle: '',
    contextLabel: 'Channel preview',
    badges: [
      { label: 'Unread focus', variant: 'blue' },
      { label: 'Composer next' },
    ],
  }
}

export interface ShellDetailActivityItem {
  title: string
  body: string
  meta: string
}

export interface ShellDetailPreview {
  hero: ShellHeroPresentation
  badges: ShellBadge[]
  stats: ShellStat[]
  activity: ShellDetailActivityItem[]
  nextSteps: string[]
}

export function getShellDetailPreview(detail: Exclude<ShellActiveDetail, null>): ShellDetailPreview {
  if (detail.kind === 'dm') {
    return {
      hero: {
        eyebrow: 'Conversation preview',
        title: `Catch up with ${detail.peerName}`,
        description: 'This space now mirrors the web phone pattern more closely with richer detail scaffolding for recent messages, shared context, and next actions.',
        stats: [
          { label: 'Unread', value: '2' },
          { label: 'Shared servers', value: '1' },
          { label: 'Reply speed', value: '~5m' },
        ],
      },
      badges: [
        { label: 'Direct message', variant: 'blue' },
        { label: 'Presence ready', variant: 'green' },
      ],
      stats: [
        { label: 'Pinned topic', value: 'Launch review' },
        { label: 'Last shared file', value: 'mockup-v3.fig' },
        { label: 'Next nudge', value: 'Today · 4:30 PM' },
      ],
      activity: [
        {
          title: 'Latest exchange',
          body: 'A short placeholder thread can live here until message history is wired, giving the shell more believable density.',
          meta: '2m ago',
        },
        {
          title: 'Shared context',
          body: 'Surface mutual servers, shared projects, or last active voice room to make the detail pane feel grounded.',
          meta: 'Design Collective',
        },
      ],
      nextSteps: [
        'Keep composer, attachments, and quick reactions in this single-column flow.',
        'Swap the placeholder activity cards for real DM metadata once message stores land.',
        'Reuse the same density for group DMs later so the shell stays consistent.',
      ],
    }
  }

  if (detail.kind === 'guild') {
    return {
      hero: {
        eyebrow: 'Server detail',
        title: detail.title,
        description: 'Server preview now includes enough scaffolding to suggest active rooms, current members, and the next likely jump target.',
        stats: [
          { label: 'Active rooms', value: '4' },
          { label: 'Members online', value: '37' },
          { label: 'Next event', value: 'Standup · 12m' },
        ],
      },
      badges: [
        { label: 'Server', variant: 'blue' },
        { label: 'Live activity', variant: 'green' },
      ],
      stats: [
        { label: 'Highlighted channel', value: '#announcements' },
        { label: 'Voice stage', value: 'Product sync' },
        { label: 'Unread summary', value: '7 mentions' },
      ],
      activity: [
        {
          title: 'What is happening now',
          body: 'Show a compact feed of server events, member joins, or topic changes before deeper browsing is connected.',
          meta: 'Now',
        },
        {
          title: 'Suggested next room',
          body: 'Point the user at the most relevant unread or recently active channel to reduce extra taps.',
          meta: '#general',
        },
      ],
      nextSteps: [
        'Replace these cards with live member, event, and announcement data.',
        'Keep the summary-first rhythm so the first screen feels useful on narrow devices.',
        'Mirror server emphasis from the web phone shell without introducing desktop complexity.',
      ],
    }
  }

  return {
    hero: {
      eyebrow: 'Channel detail',
      title: detail.title,
      description: 'Channel previews now feel closer to a live room with topic, rhythm, and likely next actions already blocked in.',
      stats: [
        { label: 'Unread line', value: 'Since 9:14 AM' },
        { label: 'People here', value: '18' },
        { label: 'Drafts', value: '1' },
      ],
    },
    badges: [
      { label: 'Channel', variant: 'blue' },
      { label: 'Thread-ready' },
    ],
    stats: [
      { label: 'Topic', value: 'Release prep + QA handoff' },
      { label: 'Latest file', value: 'release-notes.md' },
      { label: 'Voice link', value: 'Stage room live' },
    ],
    activity: [
      {
        title: 'Unread anchor',
        body: 'Reserve space for the message transition point, so users know where they would resume reading.',
        meta: '12 new messages',
      },
      {
        title: 'Composer context',
        body: 'Show topic, mention density, and attachments around the message area rather than leaving a blank placeholder.',
        meta: 'Reply suggested',
      },
    ],
    nextSteps: [
      'Attach the real message list and composer beneath this contextual header.',
      'Keep members and pinned references lightweight so the phone layout stays focused.',
      'Match the web mobile rhythm with clear back navigation and one obvious primary action.',
    ],
  }
}
