import {
  buildShellHeaderContext,
  getShellDetailPreview,
  SHELL_TAB_PRESENTATION,
} from '../presentation'
import type { ShellTabKey } from '../types'

const shellTabs: ShellTabKey[] = ['browse', 'friends', 'you']

shellTabs.forEach((tab) => {
  const presentation = SHELL_TAB_PRESENTATION[tab]

  void presentation.title
  void presentation.subtitle
  void presentation.hero
  void presentation.badges
})

const headerContext = buildShellHeaderContext({
  activeTab: 'friends',
  displayName: 'Casey',
  activeDetail: {
    kind: 'dm',
    conversationId: 'dm:u1',
    peerName: 'Alice Chen',
  },
})

void headerContext.eyebrow
void headerContext.title
void headerContext.subtitle
void headerContext.contextLabel
void headerContext.badges

const channelPreview = getShellDetailPreview({
  kind: 'channel',
  title: '#general',
  subtitle: 'Inside Dev Lounge. Channel history and composer will connect here.',
  channelId: '1',
  channelName: 'general',
  guildName: 'Dev Lounge',
})

void channelPreview.hero
void channelPreview.stats
void channelPreview.activity
void channelPreview.nextSteps
