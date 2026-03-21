'use client'

import { useState, useEffect, useCallback } from 'react'
import { searchUsers, sendFriendRequest, checkAreFriends, type UserProfile } from '@/lib/api/friends'
import { cn } from '@/lib/utils'

interface UserSearchProps {
  className?: string
}

export default function UserSearch({ className }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [friendStatuses, setFriendStatuses] = useState<Record<string, boolean>>({})
  const [requestStatuses, setRequestStatuses] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    const { data } = await searchUsers(searchTerm)
    if (data) {
      setResults(data)
      
      const statuses: Record<string, boolean> = {}
      for (const user of data) {
        const { data: isFriend } = await checkAreFriends(user.uid)
        statuses[user.uid] = isFriend || false
      }
      setFriendStatuses(statuses)
    }
    setLoading(false)
  }, [searchTerm])

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, handleSearch])

  const handleSendRequest = async (userUid: string) => {
    setRequestStatuses(prev => ({ ...prev, [userUid]: 'sending' }))
    
    const { success } = await sendFriendRequest(userUid)
    
    if (success) {
      setRequestStatuses(prev => ({ ...prev, [userUid]: 'sent' }))
      setTimeout(() => {
        setRequestStatuses(prev => ({ ...prev, [userUid]: 'sent' }))
      }, 3000)
    } else {
      setRequestStatuses(prev => ({ ...prev, [userUid]: 'error' }))
      setTimeout(() => {
        setRequestStatuses(prev => {
          const newStatuses = { ...prev }
          delete newStatuses[userUid]
          return newStatuses
        })
      }, 3000)
    }
  }

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '在线'
      case 'away':
        return '离开'
      case 'busy':
        return '忙碌'
      default:
        return '离线'
    }
  }

  return (
    <div className={cn('bg-card rounded-xl border border-border overflow-hidden', className)}>
      <div className="p-4 border-b border-border">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索用户昵称..."
            className="w-full px-4 py-2 pl-10 bg-bg-secondary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <svg
            className="absolute left-3 top-2.5 w-5 h-5 text-text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-text-secondary">
            搜索中...
          </div>
        ) : results.length === 0 && searchTerm ? (
          <div className="text-center py-8 text-text-secondary">
            未找到匹配的用户
          </div>
        ) : results.length === 0 && !searchTerm ? (
          <div className="text-center py-8 text-text-secondary">
            输入关键词搜索用户
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((user) => {
              const isFriend = friendStatuses[user.uid]
              const requestStatus = requestStatuses[user.uid]
              
              return (
                <div
                  key={user.uid}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-secondary transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                        {user.nickname.charAt(0)}
                      </div>
                      <div
                        className={cn(
                          'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card',
                          getStatusColor(user.status)
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{user.nickname}</p>
                      <p className="text-xs text-text-secondary">
                        {getStatusText(user.status)} · 等级 {user.level}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right text-xs text-text-secondary">
                      <p>{user.total_games} 场</p>
                      <p>胜率 {user.win_rate}%</p>
                    </div>
                    {isFriend ? (
                      <span className="px-3 py-1 bg-green-500/20 text-green-600 text-sm rounded-md">
                        已是好友
                      </span>
                    ) : requestStatus === 'sending' ? (
                      <span className="px-3 py-1 text-text-secondary text-sm rounded-md">
                        发送中...
                      </span>
                    ) : requestStatus === 'sent' ? (
                      <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-md">
                        已发送
                      </span>
                    ) : requestStatus === 'error' ? (
                      <button
                        onClick={() => handleSendRequest(user.uid)}
                        className="px-3 py-1 bg-red-500/20 text-red-600 text-sm rounded-md hover:bg-red-500/30 transition-colors"
                      >
                        重试
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.uid)}
                        className="px-3 py-1 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
                      >
                        添加好友
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
