'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { 
  getChatMessages, 
  sendMessage, 
  markMessagesAsRead,
  type ChatMessage as ChatMessageType,
  type ChatRoom,
  subscribeToChatMessages
} from '@/lib/api/chat'
import ChatMessage from './ChatMessage'
import EmojiPicker from './EmojiPicker'
import QuickPhrases from './QuickPhrases'
import { cn } from '@/lib/utils'

import { logger } from '@/lib/utils/logger'
interface ChatWindowProps {
  room: ChatRoom | null
  currentUserId: string
  className?: string
}

export default function ChatWindow({ room, currentUserId, className }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showQuickPhrases, setShowQuickPhrases] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const previousRoomId = useRef<string | null>(null)

  useEffect(() => {
    if (room) {
      const loadMessages = async () => {
        setLoading(true)
        const { data } = await getChatMessages(room.room_id, 50)
        if (data) {
          setMessages(data)
        }
        setLoading(false)
      }

      loadMessages()
      markMessagesAsRead(room.room_id)

      const channel = subscribeToChatMessages(room.room_id, (newMessage: ChatMessageType) => {
        setMessages(prev => [...prev, newMessage])
        
        if (newMessage.receiver_uid === currentUserId) {
          markMessagesAsRead(room.room_id)
        }
      })

      return () => {
        channel.unsubscribe()
        previousRoomId.current = room.room_id
      }
    }
  }, [room, currentUserId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!room || !inputValue.trim() || sending) return

    setSending(true)
    const { data, error } = await sendMessage(room.other_user_uid, inputValue.trim())
    
    if (error) {
      logger.error('Failed to send message:', error)
    } else if (data) {
      setInputValue('')
    }
    
    setSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handlePhraseSelect = (phrase: string) => {
    setInputValue(prev => prev + phrase)
    setShowQuickPhrases(false)
  }

  const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    if (container.scrollTop === 0 && messages.length > 0 && !loading) {
      setLoading(true)
      const oldestMessage = messages[0]
      const { data } = await getChatMessages(room!.room_id, 20, oldestMessage.created_at)
      if (data && data.length > 0) {
        setMessages(prev => [...data.reverse(), ...prev])
      }
      setLoading(false)
    }
  }

  if (!room) {
    return (
      <div className={cn('bg-card rounded-xl border border-border flex items-center justify-center', className)}>
        <div className="text-center text-text-secondary">
          <p className="text-lg mb-2">选择一个聊天</p>
          <p className="text-sm">从左侧列表选择一个好友开始聊天</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-card rounded-xl border border-border flex flex-col', className)}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
              {room.other_user_nickname.charAt(0)}
            </div>
            <div
              className={cn(
                'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card',
                room.other_user_status === 'online' && 'bg-green-500',
                room.other_user_status === 'away' && 'bg-yellow-500',
                room.other_user_status === 'busy' && 'bg-red-500',
                room.other_user_status === 'offline' && 'bg-gray-400'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">{room.other_user_nickname}</h3>
            <p className="text-xs text-text-secondary">
              {room.other_user_status === 'online' ? '在线' : '离线'}
            </p>
          </div>
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            加载中...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <p>暂无消息</p>
            <p className="text-sm mt-2">发送第一条消息开始聊天</p>
          </div>
        ) : (
          <>
            {loading && (
              <div className="text-center text-text-secondary py-2">
                加载更多消息...
              </div>
            )}
            {messages.map((message) => (
              <ChatMessage
                key={message.message_id}
                message={message}
                isOwn={message.sender_uid === currentUserId}
                senderNickname={room.other_user_nickname}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              rows={1}
              className="w-full px-4 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none pr-24"
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />
            <div className="absolute right-2 bottom-2 flex space-x-1">
              <button
                onClick={() => setShowQuickPhrases(!showQuickPhrases)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </button>
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-10">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            )}
            {showQuickPhrases && (
              <div className="absolute bottom-full right-0 mb-2 z-10">
                <QuickPhrases onPhraseSelect={handlePhraseSelect} />
              </div>
            )}
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending}
            className={cn(
              'px-4 py-2 bg-primary text-white rounded-lg transition-colors',
              (!inputValue.trim() || sending) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}
