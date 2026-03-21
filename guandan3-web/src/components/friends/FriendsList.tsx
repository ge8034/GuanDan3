'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Card, { CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { UserPlus, MessageCircle, Gamepad2 } from 'lucide-react'
import type { Friend } from '@/lib/api/friends'

interface FriendsListProps {
  friends: Friend[]
  onInvite?: (friendId: string) => void
  onChat?: (friendId: string) => void
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'busy':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'online':
      return '在线'
    case 'busy':
      return '游戏中'
    case 'away':
      return '离开'
    default:
      return '离线'
  }
}

export default function FriendsList({ friends, onInvite, onChat }: FriendsListProps) {
  const [filter, setFilter] = useState<'all' | 'online' | 'playing'>('all')

  const filteredFriends = useMemo(() => {
    return friends.filter(friend => {
      if (filter === 'all') return true
      if (filter === 'online') return friend.status === 'online'
      if (filter === 'playing') return friend.status === 'busy'
      return true
    })
  }, [friends, filter])

  const handleInvite = useCallback((friendId: string) => {
    onInvite?.(friendId)
  }, [onInvite])

  const handleChat = useCallback((friendId: string) => {
    onChat?.(friendId)
  }, [onChat])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">好友列表 ({friends.length})</h2>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              全部
            </Button>
            <Button
              variant={filter === 'online' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('online')}
            >
              在线
            </Button>
            <Button
              variant={filter === 'playing' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setFilter('playing')}
            >
              游戏中
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无好友
            </div>
          ) : (
            filteredFriends.map(friend => (
              <div
                key={friend.friend_uid}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {friend.avatar_url ? (
                        <Image
                          src={friend.avatar_url}
                          alt={friend.nickname}
                          width={40}
                          height={40}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {friend.nickname.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(friend.status)}`}
                    />
                  </div>
                  <div>
                    <div className="font-medium">{friend.nickname}</div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(friend.status)} · Lv.{friend.level}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {friend.status === 'online' && onChat && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleChat(friend.friend_uid)}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  )}
                  {friend.status === 'online' && onInvite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleInvite(friend.friend_uid)}
                    >
                      <Gamepad2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
