'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Button } from '@/components/ui/Button'
import Card, { CardBody } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import {
  searchUsers,
  sendFriendRequest,
  getFriends,
  getPendingFriendRequests,
  getSentFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  subscribeToFriendsUpdates,
  subscribeToFriendRequests,
  type Friend,
  type FriendRequest,
  type SentFriendRequest,
  type UserProfile
} from '@/lib/api/friends'
import CloudMountainBackground from '@/components/backgrounds/CloudMountainBackground'

import { logger } from '@/lib/utils/logger'
export default function FriendsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<SentFriendRequest[]>([])
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: friendsData } = await getFriends()
      const { data: requestsData } = await getPendingFriendRequests()
      const { data: sentData } = await getSentFriendRequests()

      if (friendsData) setFriends(friendsData)
      if (requestsData) setPendingRequests(requestsData)
      if (sentData) setSentRequests(sentData)
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '加载数据失败'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/')
        return
      }

      loadData()

      const friendsChannel = subscribeToFriendsUpdates((updatedFriends) => {
        setFriends(updatedFriends)
      })

      const requestsChannel = subscribeToFriendRequests((updatedRequests) => {
        setPendingRequests(updatedRequests)
      })

      return () => {
        friendsChannel.unsubscribe()
        requestsChannel.unsubscribe()
      }
    }

    let cleanup: (() => void) | undefined
    init().then(cleanupFn => {
      cleanup = cleanupFn
    })

    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [router, loadData])

  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term)
    if (term.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await searchUsers(term, 10)
      if (data) {
        setSearchResults(data)
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '搜索失败'))
    }
  }, [])

  const handleSendRequest = useCallback(async (receiverUid: string) => {
    try {
      const { success, error } = await sendFriendRequest(receiverUid)
      if (success) {
        await loadData()
        setSearchTerm('')
        setSearchResults([])
      } else {
        setError(error || '发送好友请求失败')
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '发送好友请求失败'))
    }
  }, [loadData])

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      const { success, error } = await acceptFriendRequest(requestId)
      if (success) {
        await loadData()
      } else {
        setError(error || '接受好友请求失败')
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '接受好友请求失败'))
    }
  }, [loadData])

  const handleRejectRequest = useCallback(async (requestId: string) => {
    try {
      const { success, error } = await rejectFriendRequest(requestId)
      if (success) {
        await loadData()
      } else {
        setError(error || '拒绝好友请求失败')
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '拒绝好友请求失败'))
    }
  }, [loadData])

  const handleCancelRequest = useCallback(async (requestId: string) => {
    try {
      const { success, error } = await cancelFriendRequest(requestId)
      if (success) {
        await loadData()
      } else {
        setError(error || '取消好友请求失败')
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '取消好友请求失败'))
    }
  }, [loadData])

  const handleRemoveFriend = useCallback(async (friendUid: string) => {
    if (!confirm('确定要删除这个好友吗？')) {
      return
    }

    try {
      const { success, error } = await removeFriend(friendUid)
      if (success) {
        await loadData()
      } else {
        setError(error || '删除好友失败')
      }
    } catch (e: any) {
      logger.error(e)
      setError(mapSupabaseErrorToMessage(e, '删除好友失败'))
    }
  }, [loadData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500'
      case 'busy':
        return 'bg-yellow-500'
      case 'away':
        return 'bg-orange-500'
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

  return (
    <CloudMountainBackground>
      <header className="bg-[#F5F5DC]/90 backdrop-blur-sm border-b border-[#D3D3D3] sticky top-0 z-10 relative">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A4A0A] flex items-center gap-2">
            <span className="text-3xl md:text-4xl">👥</span>
            好友系统
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/lobby')}
          >
            返回大厅
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 relative z-10">
        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardBody>
              <div className="text-red-700">{error}</div>
            </CardBody>
          </Card>
        )}

        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'friends' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('friends')}
          >
            好友列表 ({friends.length})
          </Button>
          <Button
            variant={activeTab === 'requests' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('requests')}
          >
            好友请求 ({pendingRequests.length})
          </Button>
          <Button
            variant={activeTab === 'search' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('search')}
          >
            搜索用户
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6BA539] border-t-transparent"></div>
            <p className="mt-4 text-gray-700">加载中...</p>
          </div>
        ) : (
          <>
            {activeTab === 'friends' && (
              <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
                <CardBody>
                  {friends.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">👥</div>
                      <div className="text-xl text-gray-800">暂无好友</div>
                      <p className="mt-2 text-sm text-gray-700">去搜索用户添加好友吧！</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {friends.map(friend => (
                        <div
                          key={friend.friend_uid}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar
                                src={friend.avatar_url || undefined}
                                name={friend.nickname}
                                size="lg"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(friend.status)}`}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{friend.nickname}</div>
                              <div className="text-xs text-gray-700">
                                {getStatusText(friend.status)} · Lv.{friend.level} · 胜率{friend.win_rate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRemoveFriend(friend.friend_uid)}
                          >
                            删除
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                  <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
                    <CardBody>
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">📭</div>
                        <div className="text-xl text-gray-800">暂无好友请求</div>
                      </div>
                    </CardBody>
                  </Card>
                ) : (
                  <>
                    {pendingRequests.length > 0 && (
                      <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
                        <CardBody>
                          <h3 className="text-lg font-semibold mb-4">收到的好友请求</h3>
                          <div className="space-y-3">
                            {pendingRequests.map(request => (
                              <div
                                key={request.request_id}
                                className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={request.sender_avatar_url || undefined}
                                    name={request.sender_nickname}
                                    size="lg"
                                  />
                                  <div>
                                    <div className="font-medium">{request.sender_nickname}</div>
                                    <div className="text-xs text-gray-700">
                                      {new Date(request.created_at).toLocaleString('zh-CN')}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAcceptRequest(request.request_id)}
                                  >
                                    接受
                                  </Button>
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleRejectRequest(request.request_id)}
                                  >
                                    拒绝
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    )}

                    {sentRequests.length > 0 && (
                      <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
                        <CardBody>
                          <h3 className="text-lg font-semibold mb-4">发送的好友请求</h3>
                          <div className="space-y-3">
                            {sentRequests.map(request => (
                              <div
                                key={request.request_id}
                                className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={request.receiver_avatar_url || undefined}
                                    name={request.receiver_nickname}
                                    size="lg"
                                  />
                                  <div>
                                    <div className="font-medium">{request.receiver_nickname}</div>
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={request.status === 'pending' ? 'info' : request.status === 'accepted' ? 'success' : 'error'}
                                        size="sm"
                                      >
                                        {request.status === 'pending' ? '等待中' : 
                                         request.status === 'accepted' ? '已接受' : '已拒绝'}
                                      </Badge>
                                      <span className="text-xs text-gray-700">
                                        {new Date(request.created_at).toLocaleString('zh-CN')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {request.status === 'pending' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelRequest(request.request_id)}
                                  >
                                    取消
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
                <CardBody>
                  <div className="mb-4">
                    <Input
                      type="text"
                      placeholder="搜索用户昵称..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="text-center py-4 text-gray-700">
                      请输入至少2个字符进行搜索
                    </div>
                  )}

                  {searchResults.length === 0 && searchTerm.length >= 2 && (
                    <div className="text-center py-4 text-gray-700">
                      未找到匹配的用户
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-3">
                      {searchResults.map(user => (
                        <div
                          key={user.uid}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-white/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar
                                src={user.avatar_url || undefined}
                                name={user.nickname}
                                size="lg"
                              />
                              <div
                                className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(user.status)}`}
                              />
                            </div>
                            <div>
                              <div className="font-medium">{user.nickname}</div>
                              <div className="text-xs text-gray-700">
                                {getStatusText(user.status)} · Lv.{user.level} · 胜率{user.win_rate.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSendRequest(user.uid)}
                          >
                            添加好友
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </>
        )}
      </main>
    </CloudMountainBackground>
  )
}
