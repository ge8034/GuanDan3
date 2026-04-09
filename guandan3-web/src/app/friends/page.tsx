/**
 * Friends 好友系统页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button, Badge, Card, Input } from '@/design-system/components/atoms'
import { Spinner } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useToast } from '@/lib/hooks/useToast'
import { Users, Inbox, Search, ArrowLeft } from 'lucide-react'
import { cn } from '@/design-system/utils/cn'

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
  online: { color: 'bg-success-500', text: '在线' },
  busy: { color: 'bg-amber-500', text: '游戏中' },
  away: { color: 'bg-orange-500', text: '离开' },
  offline: { color: 'bg-neutral-500', text: '离线' }
}

type UserStatus = keyof typeof statusConfig

// 用户卡片组件
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
    <Card className="flex items-center justify-between p-4 border-2 border-neutral-200 bg-white transition-colors duration-150 hover:bg-black/5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar
            alt={nickname}
            size="lg"
            src={avatarUrl}
          />
          <div className={cn(
            'absolute bottom-[-4px] right-[-4px]',
            'w-3 h-3 rounded-full',
            'border-2 border-white',
            config.color
          )} />
        </div>
        <div>
          <div className="font-medium text-sm text-neutral-900">
            {nickname}
          </div>
          <div className="text-xs text-neutral-600">
            {config.text} · Lv.{level} · 胜率 {winRate.toFixed(1)}%
          </div>
        </div>
      </div>
      {action && actionLabel && (
        <Button
          onClick={action}
          variant={actionLabel === '删除' ? 'ghost' : 'primary'}
          size="sm"
          className={cn(
            actionLabel === '删除' && 'text-error-500 hover:bg-error-500/10'
          )}
        >
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}

export default function FriendsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { showToast } = useToast()
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
    showToast({ message: '演示模式：已发送好友请求', kind: 'info' })
  }, [showToast])

  const handleAcceptRequest = useCallback((requestId: string) => {
    showToast({ message: '演示模式：已接受好友请求', kind: 'info' })
  }, [showToast])

  const handleRejectRequest = useCallback((requestId: string) => {
    showToast({ message: '演示模式：已拒绝好友请求', kind: 'info' })
  }, [showToast])

  const handleCancelRequest = useCallback((requestId: string) => {
    showToast({ message: '演示模式：已取消好友请求', kind: 'info' })
  }, [showToast])

  const handleRemoveFriend = useCallback((friendUid: string) => {
    showToast({ message: '演示模式：已删除好友', kind: 'info' })
  }, [showToast])

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
      <div className="min-h-screen pt-20">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur-md border-b-2 border-black/10">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-6 h-6" />
              好友系统
            </h1>
            <Button
              onClick={() => router.push('/lobby')}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* 选项卡 */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <button
              onClick={() => setActiveTab('friends')}
              className={cn(
                'px-6 py-3 rounded-xl border-2 min-h-11',
                'inline-flex items-center gap-2',
                'backdrop-blur-md transition-all duration-200',
                'font-medium text-base',
                activeTab === 'friends'
                  ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                  : 'border-transparent bg-white/90 text-neutral-700 hover:bg-poker-table-500/5 hover:border-poker-table-600'
              )}
            >
              <Users className="w-4 h-4" />
              好友列表 ({friends.length})
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                'px-6 py-3 rounded-xl border-2 min-h-11',
                'inline-flex items-center gap-2',
                'backdrop-blur-md transition-all duration-200',
                'font-medium text-base',
                activeTab === 'requests'
                  ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                  : 'border-transparent bg-white/90 text-neutral-700 hover:bg-poker-table-500/5 hover:border-poker-table-600'
              )}
            >
              <Inbox className="w-4 h-4" />
              好友请求 ({pendingRequests.length})
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={cn(
                'px-6 py-3 rounded-xl border-2 min-h-11',
                'inline-flex items-center gap-2',
                'backdrop-blur-md transition-all duration-200',
                'font-medium text-base',
                activeTab === 'search'
                  ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                  : 'border-transparent bg-white/90 text-neutral-700 hover:bg-poker-table-500/5 hover:border-poker-table-600'
              )}
            >
              <Search className="w-4 h-4" />
              搜索用户
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* 好友列表 */}
              {activeTab === 'friends' && (
                <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-6">
                  {friends.length === 0 ? (
                    <div className="text-center p-12">
                      <Users className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                      <div className="text-lg text-neutral-600 mb-2">暂无好友</div>
                      <p className="text-sm text-neutral-400">去搜索用户添加好友吧！</p>
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
                    <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-12 text-center">
                      <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                      <div className="text-lg text-neutral-600">暂无好友请求</div>
                    </Card>
                  ) : (
                    <>
                      {pendingRequests.length > 0 && (
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-6">
                          <h3 className="text-base font-semibold mb-4 text-neutral-900">
                            收到的好友请求
                          </h3>
                          <div className="flex flex-col gap-3">
                            {pendingRequests.map(request => (
                              <Card key={request.request_id} className="flex items-center justify-between p-4 border-2 border-neutral-200 bg-white">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    alt={request.sender_nickname}
                                    size="lg"
                                    src={request.sender_avatar_url}
                                  />
                                  <div>
                                    <div className="font-medium text-sm text-neutral-900">
                                      {request.sender_nickname}
                                    </div>
                                    <div className="text-xs text-neutral-600">
                                      {new Date(request.created_at).toLocaleString('zh-CN')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAcceptRequest(request.request_id)}
                                    variant="primary"
                                    size="sm"
                                  >
                                    接受
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectRequest(request.request_id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-error-500 hover:bg-error-500/10"
                                  >
                                    拒绝
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </Card>
                      )}

                      {sentRequests.length > 0 && (
                        <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-6">
                          <h3 className="text-base font-semibold mb-4 text-neutral-900">
                            发送的好友请求
                          </h3>
                          <div className="flex flex-col gap-3">
                            {sentRequests.map(request => (
                              <Card key={request.request_id} className="flex items-center justify-between p-4 border-2 border-neutral-200 bg-white">
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    alt={request.receiver_nickname}
                                    size="lg"
                                    src={request.receiver_avatar_url}
                                  />
                                  <div>
                                    <div className="font-medium text-sm text-neutral-900">
                                      {request.receiver_nickname}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          request.status === 'pending' ? 'primary' :
                                          request.status === 'accepted' ? 'success' : 'error'
                                        }
                                        size="sm"
                                        className={cn(
                                          request.status === 'pending' && 'bg-blue-500',
                                          request.status === 'accepted' && 'bg-success-500',
                                          request.status === 'rejected' && 'bg-error-500'
                                        )}
                                      >
                                        {request.status === 'pending' ? '等待中' :
                                          request.status === 'accepted' ? '已接受' : '已拒绝'}
                                      </Badge>
                                      <span className="text-xs text-neutral-600">
                                        {new Date(request.created_at).toLocaleString('zh-CN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {request.status === 'pending' && (
                                  <Button
                                    onClick={() => handleCancelRequest(request.request_id)}
                                    variant="outline"
                                    size="sm"
                                  >
                                    取消
                                  </Button>
                                )}
                              </Card>
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
                <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-6">
                  <div className="mb-4">
                    <div className="relative flex items-center">
                      <Search className="absolute left-3 text-neutral-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="搜索用户昵称..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="text-center p-4 text-neutral-600">
                      请输入至少2个字符进行搜索
                    </div>
                  )}

                  {searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div className="text-center p-8 text-neutral-600">
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
