export const ICE_CANDIDATE_BATCH_INTERVAL_MS = 100;

export const MAX_SIGNAL_PAYLOAD_BYTES = 16 * 1024;

export const DEFAULT_AUDIO_CONSTRAINTS = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48_000,
  sampleSize: 16,
} satisfies MediaTrackConstraints;

export const DEFAULT_SCREENSHARE_CONSTRAINTS = {
  video: {
    frameRate: { ideal: 15, max: 30 },
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
  },
  audio: false,
} satisfies DisplayMediaStreamOptions;
