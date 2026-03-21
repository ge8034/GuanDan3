'use client'

import { useEffect, useState } from 'react'
import { getChatRooms, type ChatRoom, subscribeToChatRooms } from '@/lib/api/chat'
import { cn } from '@/lib/utils'

interface ChatRoomListProps {
  selectedRoomId: string | null
  onSelectRoom: (room: ChatRoom) => void
  onRoomsLoaded?: (rooms: ChatRoom[]) => void
  className?: string
}

export default function ChatRoomList({ selectedRoomId, onSelectRoom, onRoomsLoaded, className }: ChatRoomListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadChatRooms = async () => {
      const { data } = await getChatRooms()
      if (data) {
        setRooms(data)
      }
      setLoading(false)
    }

    loadChatRooms()

    const channel = subscribeToChatRooms((updatedRooms) => {
      setRooms(updatedRooms)
      onRoomsLoaded?.(updatedRooms)
    })

    return () => {
      channel.unsubscribe()
    }
  }, [onRoomsLoaded])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'away':
        return 'bg-yellow-500'
      case 'busy':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  const truncateMessage = (content: string | null, maxLength: number = 30) => {
    if (!content) return '暂无消息'
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content
  }

  return (
    <div className={cn('bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-text-primary">消息</h2>
      </div>

      <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-text-secondary">
            加载中...
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            <p className="mb-2">还没有聊天记录</p>
            <p className="text-sm">从好友列表开始聊天</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.room_id}
              onClick={() => onSelectRoom(room)}
              className={cn(
                'p-4 cursor-pointer transition-colors hover:bg-bg-secondary',
                selectedRoomId === room.room_id && 'bg-bg-secondary'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium text-lg">
                    {room.other_user_nickname.charAt(0)}
                  </div>
                  <div
                    className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card',
                      getStatusColor(room.other_user_status)
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-text-primary truncate">
                      {room.other_user_nickname}
                    </h3>
                    <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                      {formatTime(room.last_message_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-text-secondary truncate">
                      {truncateMessage(room.last_message_content)}
                    </p>
                    {room.unread_count > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {room.unread_count > 99 ? '99+' : room.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
