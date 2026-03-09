export const SOUND_ASSETS = {
  'call-ring': require('../../../assets/sfx/call-ring.mp3'),
  'start-call': require('../../../assets/sfx/start-call.mp3'),
  'call-sound': require('../../../assets/sfx/call-sound.mp3'),
  'call-declined': require('../../../assets/sfx/call-declined.mp3'),
  'hangup': require('../../../assets/sfx/hangup.mp3'),
  'continue-call': require('../../../assets/sfx/continue-call.mp3'),
  'contact-left': require('../../../assets/sfx/contact-left.mp3'),
  'contact-online': require('../../../assets/sfx/contact-going-online.mp3'),
  'contact-offline': require('../../../assets/sfx/contact-going-offline.mp3'),
  'message-received': require('../../../assets/sfx/message-received.mp3'),
  'message-sent': require('../../../assets/sfx/message-sent.mp3'),
} as const

export type SoundName = keyof typeof SOUND_ASSETS
export type SfxCategory = 'ui' | 'call' | 'dm' | 'friend'

export const SOUND_CATEGORY_BY_NAME: Record<SoundName, SfxCategory> = {
  'call-ring': 'call',
  'start-call': 'call',
  'call-sound': 'call',
  'call-declined': 'call',
  'hangup': 'call',
  'continue-call': 'call',
  'contact-left': 'call',
  'contact-online': 'friend',
  'contact-offline': 'friend',
  'message-received': 'dm',
  'message-sent': 'ui',
}
