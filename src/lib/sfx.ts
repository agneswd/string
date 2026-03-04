// Sound file imports
import callRing from '../sfx/call-ring.mp3'
import startCall from '../sfx/start-call.mp3'
import callSound from '../sfx/call-sound.mp3'
import callDeclined from '../sfx/call-declined.mp3'
import hangup from '../sfx/hangup.mp3'
import continueCall from '../sfx/continue-call.mp3'
import contactLeft from '../sfx/contact-left.mp3'
import contactOnline from '../sfx/contact-going-online.mp3'
import contactOffline from '../sfx/contact-going-offline.mp3'
import messageReceived from '../sfx/message-received.mp3'
import messageSent from '../sfx/message-sent.mp3'

const SOUNDS = {
  'call-ring': callRing,
  'start-call': startCall,
  'call-sound': callSound,
  'call-declined': callDeclined,
  'hangup': hangup,
  'continue-call': continueCall,
  'contact-left': contactLeft,
  'contact-online': contactOnline,
  'contact-offline': contactOffline,
  'message-received': messageReceived,
  'message-sent': messageSent,
} as const

export type SoundName = keyof typeof SOUNDS

/** Play a sound effect once. */
export function playSound(name: SoundName): void {
  try {
    const audio = new Audio(SOUNDS[name])
    audio.volume = 0.5
    audio.play().catch(() => {/* user hasn't interacted yet */})
  } catch { /* ignore */ }
}

/**
 * Play a sound in a loop. Returns a stop function.
 * The sound replays every `intervalMs` (default: duration-based).
 */
export function playLoop(name: SoundName, intervalMs = 3000): () => void {
  let stopped = false
  let currentAudio: HTMLAudioElement | null = null
  let timeoutId: number | undefined

  const play = () => {
    if (stopped) return
    try {
      currentAudio = new Audio(SOUNDS[name])
      currentAudio.volume = 0.5
      currentAudio.play().catch(() => {})
      timeoutId = window.setTimeout(play, intervalMs)
    } catch { /* ignore */ }
  }

  play()

  return () => {
    stopped = true
    if (timeoutId !== undefined) clearTimeout(timeoutId)
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio = null
    }
  }
}
