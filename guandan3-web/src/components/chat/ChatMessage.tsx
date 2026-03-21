'use client'

import { cn } from '@/lib/utils'

interface ChatMessageProps {
  message: {
    message_id: string
    sender_uid: string
    content: string
    is_read: boolean
    created_at: string
  }
  isOwn: boolean
  showAvatar?: boolean
  senderNickname?: string
  className?: string
}

export default function ChatMessage({ message, isOwn, showAvatar = false, senderNickname, className }: ChatMessageProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={cn('flex mb-4', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div className={cn('flex max-w-[70%]', isOwn ? 'flex-row-reverse' : 'flex-row')}>
        {showAvatar && !isOwn && (
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0 mr-2">
            {senderNickname?.charAt(0)}
          </div>
        )}
        
        <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
          <div
            className={cn(
              'px-4 py-2 rounded-2xl',
              isOwn
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-bg-secondary text-text-primary rounded-bl-sm'
            )}
          >
            <p className="break-words">{message.content}</p>
          </div>
          
          <div className={cn('flex items-center mt-1 space-x-2', isOwn ? 'mr-1' : 'ml-1')}>
            <span className="text-xs text-text-secondary">
              {formatTime(message.created_at)}
            </span>
            {isOwn && message.is_read && (
              <span className="text-xs text-text-secondary">已读</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
