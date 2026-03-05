import { type FormEvent, useCallback, useMemo, memo } from 'react'

export type DmQuickUserId = string | number
export type DmQuickChannelId = string | number

export interface DmQuickUserItem {
  id: DmQuickUserId
  name: string
}

export interface DmQuickChannelItem {
  id: DmQuickChannelId
  name: string
}

export interface DmQuickPanelProps {
  availableUsers: DmQuickUserItem[]
  onCreateDm: (userId: DmQuickUserId) => void
  dmChannels: DmQuickChannelItem[]
  selectedChannelId?: DmQuickChannelId
  onSelectChannel: (channelId: DmQuickChannelId) => void
  messageValue: string
  onMessageChange: (value: string) => void
  onSendMessage: (message: string) => void
  className?: string
}

export const DmQuickPanel = memo(function DmQuickPanel({
  availableUsers,
  onCreateDm,
  dmChannels,
  selectedChannelId,
  onSelectChannel,
  messageValue,
  onMessageChange,
  onSendMessage,
  className,
}: DmQuickPanelProps) {
  const handleCreateDm = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const userId = new FormData(form).get('userId')
    if (userId === null || userId === '') {
      return
    }

    onCreateDm(userId)
    form.reset()
  }, [onCreateDm])

  const handleSend = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = messageValue.trim()
    if (!message) {
      return
    }

    onSendMessage(message)
  }, [messageValue, onSendMessage])

  const userOptions = useMemo(
    () => availableUsers.map((user) => (
      <option key={String(user.id)} value={String(user.id)}>
        {user.name}
      </option>
    )),
    [availableUsers],
  )

  const channelItems = useMemo(
    () => dmChannels.map((channel) => {
      const isSelected = channel.id === selectedChannelId
      return (
        <li key={String(channel.id)}>
          <button type="button" onClick={() => onSelectChannel(channel.id)} aria-pressed={isSelected}>
            {channel.name}
          </button>
        </li>
      )
    }),
    [dmChannels, selectedChannelId, onSelectChannel],
  )

  const canSend = useMemo(() => !!messageValue.trim(), [messageValue])

  return (
    <section className={`tw-pane ${className ?? ''}`.trim()} aria-label="DM quick panel">
      <form onSubmit={handleCreateDm}>
        <label>
          New DM
          <select name="userId" defaultValue="">
            <option value="" disabled>
              Select user
            </option>
            {userOptions}
          </select>
        </label>
        <button type="submit">Create</button>
      </form>

      <ul>
        {channelItems}
      </ul>

      <form onSubmit={handleSend}>
        <input
          value={messageValue}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Message"
          aria-label="DM message"
        />
        <button type="submit" disabled={!canSend}>
          Send
        </button>
      </form>
    </section>
  )
})