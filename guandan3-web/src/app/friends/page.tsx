'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Avatar } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useToast } from '@/lib/hooks/useToast'
import { Users, Inbox, Search, Loader2, ArrowLeft } from 'lucide-react'

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
  online: { color: '#22c55e', text: '在线' },
  busy: { color: '#f59e0b', text: '游戏中' },
  away: { color: '#f97316', text: '离开' },
  offline: { color: '#6b7280', text: '离线' }
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        backgroundColor: 'white',
        transition: 'all 0.15s ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Avatar
            alt={nickname}
            size="lg"
            src={avatarUrl}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: config.color,
              border: '2px solid white'
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
            {nickname}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            {config.text} · Lv.{level} · 胜率 {winRate.toFixed(1)}%
          </div>
        </div>
      </div>
      {action && actionLabel && (
        <button
          onClick={action}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: actionLabel === '删除'
              ? '2px solid transparent'
              : '2px solid #1a472a',
            backgroundColor: actionLabel === '删除'
              ? 'transparent'
              : '#1a472a',
            color: actionLabel === '删除' ? '#ef4444' : 'white',
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: '36px',
          }}
          onMouseEnter={(e) => {
            if (actionLabel === '删除') {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
            } else {
              e.currentTarget.style.backgroundColor = '#2d5a3d'
              e.currentTarget.style.borderColor = '#2d5a3d'
            }
          }}
          onMouseLeave={(e) => {
            if (actionLabel === '删除') {
              e.currentTarget.style.backgroundColor = 'transparent'
            } else {
              e.currentTarget.style.backgroundColor = '#1a472a'
              e.currentTarget.style.borderColor = '#1a472a'
            }
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
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
      <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
        {/* 头部 */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(245, 245, 220, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users style={{ width: '24px', height: '24px' }} />
              好友系统
            </h1>
            <button
              onClick={() => router.push('/lobby')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.borderColor = '#d4af37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回大厅
            </button>
          </div>
        </header>

        <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          {/* 选项卡 */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('friends')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid ' + (activeTab === 'friends' ? '#d4af37' : 'transparent'),
                backgroundColor: activeTab === 'friends' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: activeTab === 'friends' ? '#d4af37' : '#374151',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'friends' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'friends') {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                  e.currentTarget.style.borderColor = '#2d5a3d'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'friends') {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <Users style={{ width: '16px', height: '16px' }} />
              好友列表 ({friends.length})
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid ' + (activeTab === 'requests' ? '#d4af37' : 'transparent'),
                backgroundColor: activeTab === 'requests' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: activeTab === 'requests' ? '#d4af37' : '#374151',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'requests' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'requests') {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                  e.currentTarget.style.borderColor = '#2d5a3d'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'requests') {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <Inbox style={{ width: '16px', height: '16px' }} />
              好友请求 ({pendingRequests.length})
            </button>

            <button
              onClick={() => setActiveTab('search')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                border: '2px solid ' + (activeTab === 'search' ? '#d4af37' : 'transparent'),
                backgroundColor: activeTab === 'search' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 255, 255, 0.9)',
                color: activeTab === 'search' ? '#d4af37' : '#374151',
                fontSize: '0.9375rem',
                fontWeight: activeTab === 'search' ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '44px',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'search') {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                  e.currentTarget.style.borderColor = '#2d5a3d'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'search') {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.borderColor = 'transparent'
                }
              }}
            >
              <Search style={{ width: '16px', height: '16px' }} />
              搜索用户
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* 好友列表 */}
              {activeTab === 'friends' && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {friends.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <Users style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#9ca3af' }} />
                      <div style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>暂无好友</div>
                      <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>去搜索用户添加好友吧！</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                </div>
              )}

              {/* 好友请求 */}
              {activeTab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        border: '2px solid #e5e7eb',
                        padding: '3rem',
                        textAlign: 'center'
                      }}
                    >
                      <Inbox style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#9ca3af' }} />
                      <div style={{ fontSize: '1.125rem', color: '#6b7280' }}>暂无好友请求</div>
                    </div>
                  ) : (
                    <>
                      {pendingRequests.length > 0 && (
                        <div
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '16px',
                            border: '2px solid #e5e7eb',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                            收到的好友请求
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pendingRequests.map(request => (
                              <div
                                key={request.request_id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: '2px solid #e5e7eb',
                                  backgroundColor: 'white',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <Avatar
                                    alt={request.sender_nickname}
                                    size="lg"
                                    src={request.sender_avatar_url}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                                      {request.sender_nickname}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                      {new Date(request.created_at).toLocaleString('zh-CN')}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button
                                    onClick={() => handleAcceptRequest(request.request_id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      borderRadius: '8px',
                                      border: '2px solid #1a472a',
                                      backgroundColor: '#1a472a',
                                      color: 'white',
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                      minHeight: '36px',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#2d5a3d'
                                      e.currentTarget.style.borderColor = '#2d5a3d'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#1a472a'
                                      e.currentTarget.style.borderColor = '#1a472a'
                                    }}
                                  >
                                    接受
                                  </button>
                                  <button
                                    onClick={() => handleRejectRequest(request.request_id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      borderRadius: '8px',
                                      border: '2px solid transparent',
                                      backgroundColor: 'transparent',
                                      color: '#ef4444',
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                      minHeight: '36px',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                    }}
                                  >
                                    拒绝
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {sentRequests.length > 0 && (
                        <div
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            borderRadius: '16px',
                            border: '2px solid #e5e7eb',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                            发送的好友请求
                          </h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {sentRequests.map(request => (
                              <div
                                key={request.request_id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: '2px solid #e5e7eb',
                                  backgroundColor: 'white',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                  <Avatar
                                    alt={request.receiver_nickname}
                                    size="lg"
                                    src={request.receiver_avatar_url}
                                  />
                                  <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#111827' }}>
                                      {request.receiver_nickname}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span
                                        style={{
                                          padding: '0.25rem 0.5rem',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          fontWeight: 500,
                                          backgroundColor:
                                            request.status === 'pending' ? '#3b82f6' :
                                            request.status === 'accepted' ? '#22c55e' : '#ef4444',
                                          color: 'white'
                                        }}
                                      >
                                        {request.status === 'pending' ? '等待中' :
                                          request.status === 'accepted' ? '已接受' : '已拒绝'}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                        {new Date(request.created_at).toLocaleString('zh-CN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {request.status === 'pending' && (
                                  <button
                                    onClick={() => handleCancelRequest(request.request_id)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      borderRadius: '8px',
                                      border: '2px solid #e5e7eb',
                                      backgroundColor: 'transparent',
                                      color: '#374151',
                                      fontSize: '0.875rem',
                                      fontWeight: 500,
                                      cursor: 'pointer',
                                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                      minHeight: '36px',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                                      e.currentTarget.style.borderColor = '#2d5a3d'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent'
                                      e.currentTarget.style.borderColor = '#e5e7eb'
                                    }}
                                  >
                                    取消
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 搜索用户 */}
              {activeTab === 'search' && (
                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '16px',
                    border: '2px solid #e5e7eb',
                    padding: '1.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ marginBottom: '1rem' }}>
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Search style={{ position: 'absolute', left: '0.75rem', color: '#9ca3af', width: '16px', height: '16px' }} />
                      <input
                        type="text"
                        placeholder="搜索用户昵称..."
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem 0.75rem 2.5rem',
                          borderRadius: '12px',
                          border: '2px solid #e5e7eb',
                          fontSize: '0.875rem',
                          backgroundColor: 'white',
                          color: '#111827',
                          outline: 'none',
                          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#a78bfa'
                          e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.2)'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e5e7eb'
                          e.target.style.boxShadow = 'none'
                        }}
                      />
                    </div>
                  </div>

                  {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280' }}>
                      请输入至少2个字符进行搜索
                    </div>
                  )}

                  {searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      未找到匹配的用户
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
