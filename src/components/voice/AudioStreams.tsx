interface AudioStreamsProps {
  audioStreams: [string, MediaStream][]
  isDeafened: boolean
  locallyMutedUsers: Set<string>
}

export function AudioStreams({ audioStreams, isDeafened, locallyMutedUsers }: AudioStreamsProps) {
  return (
    <>
      {audioStreams.map(([key, stream]) => {
        const peerId = key.endsWith(':audio') ? key.slice(0, -6) : key;
        return (
          <audio
            key={key}
            autoPlay
            muted={isDeafened || locallyMutedUsers.has(peerId)}
            ref={(el) => {
              if (el && el.srcObject !== stream) {
                el.srcObject = stream;
              }
            }}
          />
        );
      })}
    </>
  )
}
