interface AudioStreamsProps {
  audioStreams: [string, MediaStream][]
  isDeafened: boolean
  locallyMutedUsers: Set<string>
  defaultVolume: number
  userVolumes: Record<string, number>
}

function ManagedAudioStream({
  stream,
  peerId,
  muted,
  volume,
}: {
  stream: MediaStream
  peerId: string
  muted: boolean
  volume: number
}) {
  return (
    <audio
      key={`${peerId}:audio`}
      autoPlay
      muted={muted}
      ref={(el) => {
        if (!el) {
          return
        }

        if (el.srcObject !== stream) {
          el.srcObject = stream
        }

        el.volume = Math.max(0, Math.min(1, volume / 100))
      }}
    />
  )
}

export function AudioStreams({ audioStreams, isDeafened, locallyMutedUsers, defaultVolume, userVolumes }: AudioStreamsProps) {
  return (
    <>
      {audioStreams.map(([key, stream]) => {
        const peerId = key.endsWith(':audio') ? key.slice(0, -6) : key
        const resolvedVolume = userVolumes[peerId] ?? defaultVolume
        return (
          <ManagedAudioStream
            key={key}
            stream={stream}
            peerId={peerId}
            muted={isDeafened || locallyMutedUsers.has(peerId)}
            volume={resolvedVolume}
          />
        )
      })}
    </>
  )
}
