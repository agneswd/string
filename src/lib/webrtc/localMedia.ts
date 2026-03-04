import { DEFAULT_AUDIO_CONSTRAINTS, DEFAULT_SCREENSHARE_CONSTRAINTS } from './constants';

export async function getMicrophoneStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: DEFAULT_AUDIO_CONSTRAINTS,
    video: false,
  });
}

export async function getScreenShareStream(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia(DEFAULT_SCREENSHARE_CONSTRAINTS);
}

export function stopStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;

  stream.getTracks().forEach((track) => {
    track.stop();
  });
}

export function toggleAudioTrackEnabled(
  stream: MediaStream | null | undefined,
  enabled: boolean,
): void {
  if (!stream) return;

  stream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
}
