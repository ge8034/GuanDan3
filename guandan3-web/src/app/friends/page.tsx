'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Avatar, Button, Badge, Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { Users, Inbox, Search, Loader2, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// 模拟数据（用于演示）
const mockFriends = [
  {
    friend_uid: '1',
    nickname: '小明',
    avatar_url: '',
    status: 'online',
    level: 15,
    win_rate: 65.5
  },
  {
    friend_uid: '2',
    nickname: '阿华',
    avatar_url: '',
    status: 'busy',
    level: 22,
    win_rate: 58.2
  },
  {
    friend_uid: '3',
    nickname: '老王',
    avatar_url: '',
    status: 'away',
    level: 18,
    win_rate: 72.0
  },
]

const mockPendingRequests = [
  {
    request_id: 'req1',
    sender_nickname: '新玩家',
    sender_avatar_url: '',
    created_at: new Date().toISOString(),
  },
]

const mockSentRequests = [
  {
    request_id: 'sent1',
    receiver_nickname: '高手玩家',
    receiver_avatar_url: '',
    status: 'pending',
    created_at: new Date().toISOString(),
  },
]

const mockSearchResults = [
  {
    uid: 'user1',
    nickname: '测试玩家1',
    avatar_url: '',
    status: 'online',
    level: 10,
    win_rate: 50.0,
  },
  {
    uid: 'user2',
    nickname: '测试玩家2',
    avatar_url: '',
    status: 'busy',
    level: 12,
    win_rate: 55.5,
  },
]

// 状态配置
const statusConfig = {
  online: { color: 'bg-success', text: '在线' },
  busy: { color: 'bg-warning', text: '游戏中' },
  away: { color: 'bg-error', text: '离开' },
  offline: { color: 'bg-neutral-400', text: '离线' }
} as const

type UserStatus = keyof typeof statusConfig

// 用户卡片组件 - 使用 Impeccable Design 规范
function UserCard({
  nickname,
  avatarUrl,
  status,
  level,
  winRate,
  action,
  actionLabel
}: {
  nickname: string
  avatarUrl?: string
  status: UserStatus
  level: number
  winRate: number
  action?: () => void
  actionLabel?: string
}) {
  const config = statusConfig[status] || statusConfig.offline

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 bg-white transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-neutral-50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar alt={nickname} size="lg" src={avatarUrl} />
          <div className={cn(
            'absolute bottom-[-4px] right-[-4px] w-3 h-3 rounded-full border-2 border-white',
            config.color
          )} />
        </div>
        <div>
          <div className="font-medium text-sm text-neutral-900">
            {nickname}
          </div>
          <div className="text-xs text-neutral-500">
            {config.text} · Lv.{level} · 胜率 {winRate.toFixed(1)}%
          </div>
        </div>
      </div>
      {action && actionLabel && (
        <Button
          variant={actionLabel === '删除' ? 'ghost' : 'primary'}
          size="sm"
          onClick={action}
          className={cn(
            actionLabel === '删除' && 'text-error hover:bg-error/5'
          )}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}

// 好友请求卡片
function FriendRequestCard({
  nickname,
  avatarUrl,
  createdAt,
  onAccept,
  onReject
}: {
  nickname: string
  avatarUrl?: string
  createdAt: string
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 bg-white">
      <div className="flex items-center gap-3">
        <Avatar alt={nickname} size="lg" src={avatarUrl} />
        <div>
          <div className="font-medium text-sm text-neutral-900">
            {nickname}
          </div>
          <div className="text-xs text-neutral-500">
            {new Date(createdAt).toLocaleString('zh-CN')}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="primary" size="sm" onClick={onAccept}>
          接受
        </Button>
        <Button variant="ghost" size="sm" onClick={onReject} className="text-error hover:bg-error/5">
          拒绝
        </Button>
      </div>
    </div>
  )
}

// 发送的请求卡片
function SentRequestCard({
  nickname,
  avatarUrl,
  status,
  createdAt,
  onCancel
}: {
  nickname: string
  avatarUrl?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  onCancel?: () => void
}) {
  const statusConfig = {
    pending: { variant: 'primary' as const, label: '等待中' },
    accepted: { variant: 'success' as const, label: '已接受' },
    rejected: { variant: 'error' as const, label: '已拒绝' }
  }

  const config = statusConfig[status]

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border-2 border-neutral-200 bg-white">
      <div className="flex items-center gap-3">
        <Avatar alt={nickname} size="lg" src={avatarUrl} />
        <div>
          <div className="font-medium text-sm text-neutral-900">
            {nickname}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={config.variant} size="sm">
              {config.label}
            </Badge>
            <span className="text-xs text-neutral-500">
              {new Date(createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
      {status === 'pending' && onCancel && (
        <Button variant="outline" size="sm" onClick={onCancel}>
          取消
        </Button>
      )}
    </div>
  )
}

// 选项卡按钮
function TabButton({
  active,
  icon,
  label,
  count,
  onClick
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2',
        'min-h-[44px] text-base font-medium cursor-pointer',
        'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'backdrop-blur-sm',
        active
          ? 'border-accent-gold bg-accent-gold/10 text-accent-gold font-semibold'
          : 'border-transparent bg-white/90 text-neutral-700 hover:bg-primary/5 hover:border-primary'
      )}
    >
      {icon}
      {label} ({count})
    </button>
  )
}

export default function FriendsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState(mockFriends)
  const [pendingRequests, setPendingRequests] = useState(mockPendingRequests)
  const [sentRequests, setSentRequests] = useState(mockSentRequests)
  const [searchResults, setSearchResults] = useState<typeof mockSearchResults>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleSendRequest = useCallback((uid: string) => {
    alert('演示模式：已发送好友请求')
  }, [])

  const handleAcceptRequest = useCallback((requestId: string) => {
    alert('演示模式：已接受好友请求')
  }, [])

  const handleRejectRequest = useCallback((requestId: string) => {
    alert('演示模式：已拒绝好友请求')
  }, [])

  const handleCancelRequest = useCallback((requestId: string) => {
    alert('演示模式：已取消好友请求')
  }, [])

  const handleRemoveFriend = useCallback((friendUid: string) => {
    alert('演示模式：已删除好友')
  }, [])

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
    if (term.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearchResults(mockSearchResults)
  }, [])

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen pt-16">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-[rgba(245,245,220,0.9)] backdrop-blur-sm border-b-2 border-black/10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              好友系统
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/lobby')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-6">
          {/* 选项卡 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <TabButton
              active={activeTab === 'friends'}
              icon={<Users className="w-4 h-4" />}
              label="好友列表"
              count={friends.length}
              onClick={() => setActiveTab('friends')}
            />
            <TabButton
              active={activeTab === 'requests'}
              icon={<Inbox className="w-4 h-4" />}
              label="好友请求"
              count={pendingRequests.length}
              onClick={() => setActiveTab('requests')}
            />
            <TabButton
              active={activeTab === 'search'}
              icon={<Search className="w-4 h-4" />}
              label="搜索用户"
              count={0}
              onClick={() => setActiveTab('search')}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 好友列表 */}
              {activeTab === 'friends' && (
                <Card variant="elevated" padding="lg">
                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                      <div className="text-lg text-neutral-600 mb-2">暂无好友</div>
                      <p className="text-sm text-neutral-500">去搜索用户添加好友吧！</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {friends.map(friend => (
                        <UserCard
                          key={friend.friend_uid}
                          nickname={friend.nickname}
                          avatarUrl={friend.avatar_url}
                          status={friend.status as UserStatus}
                          level={friend.level}
                          winRate={friend.win_rate}
                          action={() => handleRemoveFriend(friend.friend_uid)}
                          actionLabel="删除"
                        />
                      ))}
                    </div>
                  )}
                </Card>
              )}

              {/* 好友请求 */}
              {activeTab === 'requests' && (
                <div className="flex flex-col gap-4">
                  {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                    <Card variant="elevated" padding="lg" className="text-center">
                      <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                      <div className="text-lg text-neutral-600">暂无好友请求</div>
                    </Card>
                  ) : (
                    <>
                      {pendingRequests.length > 0 && (
                        <Card variant="elevated" padding="lg">
                          <h3 className="text-base font-semibold mb-4 text-neutral-900">
                            收到的好友请求
                          </h3>
                          <div className="flex flex-col gap-3">
                            {pendingRequests.map(request => (
                              <FriendRequestCard
                                key={request.request_id}
                                nickname={request.sender_nickname}
                                avatarUrl={request.sender_avatar_url}
                                createdAt={request.created_at}
                                onAccept={() => handleAcceptRequest(request.request_id)}
                                onReject={() => handleRejectRequest(request.request_id)}
                              />
                            ))}
                          </div>
                        </Card>
                      )}

                      {sentRequests.length > 0 && (
                        <Card variant="elevated" padding="lg">
                          <h3 className="text-base font-semibold mb-4 text-neutral-900">
                            发送的好友请求
                          </h3>
                          <div className="flex flex-col gap-3">
                            {sentRequests.map(request => (
                              <SentRequestCard
                                key={request.request_id}
                                nickname={request.receiver_nickname}
                                avatarUrl={request.receiver_avatar_url}
                                status={request.status as 'pending' | 'accepted' | 'rejected'}
                                createdAt={request.created_at}
                                onCancel={() => handleCancelRequest(request.request_id)}
                              />
                            ))}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 搜索用户 */}
              {activeTab === 'search' && (
                <Card variant="elevated" padding="lg">
                  <div className="mb-4">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 text-neutral-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="搜索用户昵称..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-neutral-200 text-sm bg-white text-neutral-900 outline-none transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus:border-primary/50 focus:ring-4 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="text-center py-4 text-neutral-500">
                      请输入至少2个字符进行搜索
                    </div>
                  )}

                  {searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div className="text-center py-8 text-neutral-500">
                      未找到匹配的用户
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {searchResults.map(user => (
                        <UserCard
                          key={user.uid}
                          nickname={user.nickname}
                          avatarUrl={user.avatar_url}
                          status={user.status as UserStatus}
                          level={user.level}
                          winRate={user.win_rate}
                          action={() => handleSendRequest(user.uid)}
                          actionLabel="添加好友"
                        />
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}
