import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'

import { SOUND_ASSETS, SOUND_CATEGORY_BY_NAME, type SfxCategory, type SoundName } from './soundAssets'

const DEFAULT_LEVELS: Record<SfxCategory, number> = {
  ui: 0.5,
  call: 0.5,
  dm: 0.5,
  friend: 0.5,
}

let sfxLevels: Record<SfxCategory, number> = { ...DEFAULT_LEVELS }
let audioModeReady = false

export function setSfxLevels(levels: Partial<Record<SfxCategory, number>>) {
  sfxLevels = {
    ...sfxLevels,
    ...Object.fromEntries(
      Object.entries(levels).map(([key, value]) => [key, clampVolume(value ?? DEFAULT_LEVELS[key as SfxCategory])]),
    ) as Partial<Record<SfxCategory, number>>,
  }
}

export function playSound(name: SoundName): void {
  void ensureAudioMode()

  try {
    const player = createAudioPlayer(SOUND_ASSETS[name])
    const cleanup = attachCleanup(player)
    player.volume = resolveVolume(name)
    player.play()

    if (player.isLoaded && player.duration > 0) {
      scheduleFallbackCleanup(cleanup, player.duration)
    }
  } catch {
    // ignore playback failures on unsupported devices / simulators
  }
}

export function playLoop(name: SoundName): () => void {
  void ensureAudioMode()

  let stopped = false
  let player: ReturnType<typeof createAudioPlayer> | null = null
  let subscription: { remove: () => void } | null = null
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null

  const cleanupPlayback = () => {
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout)
      fallbackTimeout = null
    }

    subscription?.remove()
    subscription = null

    if (player) {
      try {
        player.remove()
      } catch {
        // ignore cleanup failures
      }
      player = null
    }
  }

  const start = () => {
    if (stopped) {
      return
    }

    cleanupPlayback()

    try {
      player = createAudioPlayer(SOUND_ASSETS[name])
      player.volume = resolveVolume(name)
      subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (stopped) {
          return
        }

        if (status.didJustFinish) {
          start()
        }
      })
      player.play()

      if (player.isLoaded && player.duration > 0) {
        fallbackTimeout = setTimeout(start, Math.ceil(player.duration * 1000) + 100)
      }
    } catch {
      cleanupPlayback()
    }
  }

  start()

  return () => {
    stopped = true
    cleanupPlayback()
  }
}

function resolveVolume(name: SoundName): number {
  return sfxLevels[SOUND_CATEGORY_BY_NAME[name]] ?? DEFAULT_LEVELS.ui
}

async function ensureAudioMode() {
  if (audioModeReady) {
    return
  }

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      allowsRecording: false,
      shouldPlayInBackground: false,
    })
    audioModeReady = true
  } catch {
    // ignore audio mode errors and attempt playback anyway
  }
}

function attachCleanup(player: ReturnType<typeof createAudioPlayer>) {
  let removed = false
  let fallbackTimeout: ReturnType<typeof setTimeout> | null = null

  const cleanup = () => {
    if (removed) {
      return
    }

    removed = true
    if (fallbackTimeout) {
      clearTimeout(fallbackTimeout)
      fallbackTimeout = null
    }

    subscription.remove()
    try {
      player.remove()
    } catch {
      // ignore cleanup failures
    }
  }

  const subscription = player.addListener('playbackStatusUpdate', (status) => {
    if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration && !status.playing)) {
      cleanup()
    }
  })

  fallbackTimeout = setTimeout(cleanup, 15000)
  return cleanup
}

function scheduleFallbackCleanup(cleanup: () => void, durationSeconds: number) {
  setTimeout(cleanup, Math.ceil(durationSeconds * 1000) + 250)
}

function clampVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LEVELS.ui
  }

  if (value < 0) {
    return 0
  }

  if (value > 1) {
    return 1
  }

  return value
}
