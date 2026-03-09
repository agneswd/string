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
import { trackAudioElement, untrackAudioElement } from './connection'

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

type SfxCategory = 'ui' | 'call' | 'dm' | 'friend'

const SOUND_CATEGORY_BY_NAME: Record<SoundName, SfxCategory> = {
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

let sfxVolume = 0.5
let sfxLevels: Record<SfxCategory, number> = {
  ui: 0.5,
  call: 0.5,
  dm: 0.5,
  friend: 0.5,
}

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return sfxVolume
  if (volume < 0) return 0
  if (volume > 1) return 1
  return volume
}

export function setSfxVolume(volume: number): void {
  sfxVolume = clampVolume(volume)
  sfxLevels.ui = sfxVolume
}

export function setSfxLevels(levels: Partial<Record<SfxCategory, number>>): void {
  sfxLevels = {
    ...sfxLevels,
    ...Object.fromEntries(
      Object.entries(levels).map(([key, value]) => [key, clampVolume(value ?? sfxLevels[key as SfxCategory])]),
    ) as Partial<Record<SfxCategory, number>>,
  }
  sfxVolume = sfxLevels.ui
}

export function getSfxVolume(): number {
  return sfxVolume
}

/** Play a sound effect once. */
export function playSound(name: SoundName): void {
  try {
    const audio = new Audio(SOUNDS[name])
    trackAudioElement(audio)
    audio.volume = sfxLevels[SOUND_CATEGORY_BY_NAME[name]] ?? sfxVolume
    const cleanup = () => {
      audio.removeEventListener('ended', cleanup)
      audio.removeEventListener('error', cleanup)
      untrackAudioElement(audio)
    }
    audio.addEventListener('ended', cleanup)
    audio.addEventListener('error', cleanup)
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

  const clearScheduledReplay = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  const cleanupAudio = (audioRef: HTMLAudioElement) => {
    untrackAudioElement(audioRef)
    if (currentAudio === audioRef) {
      currentAudio = null
    }
  }

  const scheduleReplay = (delayMs: number) => {
    if (stopped) return
    clearScheduledReplay()
    timeoutId = window.setTimeout(play, Math.max(0, delayMs))
  }

  const play = () => {
    if (stopped) return
    try {
      currentAudio = new Audio(SOUNDS[name])
      trackAudioElement(currentAudio)
      currentAudio.volume = sfxLevels[SOUND_CATEGORY_BY_NAME[name]] ?? sfxVolume
      const audioRef = currentAudio
      const startedAt = Date.now()
      const finishPlayback = () => {
        audioRef.removeEventListener('ended', finishPlayback)
        audioRef.removeEventListener('error', finishPlayback)
        cleanupAudio(audioRef)
        scheduleReplay(intervalMs - (Date.now() - startedAt))
      }
      audioRef.addEventListener('ended', finishPlayback)
      audioRef.addEventListener('error', finishPlayback)
      currentAudio.play().catch(() => {
        finishPlayback()
      })
    } catch { /* ignore */ }
  }

  play()

  return () => {
    stopped = true
    clearScheduledReplay()
    if (currentAudio) {
      const audioRef = currentAudio
      currentAudio.pause()
      currentAudio.currentTime = 0
      cleanupAudio(audioRef)
      currentAudio = null
    }
  }
}
