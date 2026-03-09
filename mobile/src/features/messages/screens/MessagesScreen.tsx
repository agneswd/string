import { useState } from 'react'

import { ChatScreen, DmListScreen, type ChatScreenParams } from '../../dm'

export function MessagesScreen() {
  const [activeChat, setActiveChat] = useState<ChatScreenParams | null>(null)

  if (activeChat) {
    return (
      <ChatScreen
        conversationId={activeChat.conversationId}
        peerName={activeChat.peerName}
        onBack={() => setActiveChat(null)}
      />
    )
  }

  return <DmListScreen onOpenConversation={setActiveChat} />
}
