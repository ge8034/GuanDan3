/**
 * Lobby 大厅页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRoomStore } from '@/lib/store/room'
import { useToast } from '@/lib/hooks/useToast'
import { sortRooms } from '@/lib/utils/lobby'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { throttle } from '@/lib/utils/throttle'
import QRCode from 'qrcode'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { BuildingIcon, UserGroupIcon, OnlineIcon, CheckCircleIcon, RefreshIcon } from '@/components/icons/LandscapeIcons'
import { Loader2, Users } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

// 设计系统组件
import { Button } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { Input } from '@/design-system/components/atoms'
import { Switch } from '@/design-system/components/atoms'
import { Badge } from '@/design-system/components/atoms'
import { Spinner } from '@/design-system/components/atoms'
import { Skeleton } from '@/design-system/components/molecules'
import { Modal, ModalContent, ModalFooter } from '@/design-system/components/molecules'
import { Avatar } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'

type Room = {
  id: string
  name: string
  mode: string
  type: string
  status: string
  visibility: string
  owner_uid: string
  created_at: string
  room_members: Array<{
    id: string
    online?: boolean
    seat_no?: number
    ready?: boolean
    member_type: string
  }>
}

function getModeLabel(mode: string) {
  const labels: Record<string, string> = {
    pvp4: '4人对战',
    pve1v3: '1v3练习',
  }
  return labels[mode] || mode
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    classic: '经典',
    ranked: '排位',
    casual: '娱乐',
  }
  return labels[type] || type
}

// 房间卡片骨架屏
function RoomCardSkeleton() {
  return (
    <Card className="h-[180px]">
      <Skeleton variant="rect" className="h-24 w-full" />
      <div className="space-y-3 p-4">
        <Skeleton variant="text" className="h-4 w-1/2" />
        <Skeleton variant="text" className="h-4 w-1/3" />
      </div>
    </Card>
  )
}

export default function LobbyPage() {
  const router = useRouter()
  const { createRoom, createPracticeRoom, joinRoom } = useRoomStore()
  const { theme } = useTheme()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isPractice, setIsPractice] = useState(false)
  const [onlyJoinable, setOnlyJoinable] = useState(true)
  const [onlyHasOnline, setOnlyHasOnline] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [detailRoom, setDetailRoom] = useState<Room | null>(null)
  const [lastRefreshAt, setLastRefreshAt] = useState(0)
  const [qrVisible, setQrVisible] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const { showToast, hideToast, toastView } = useToast()

  useEffect(() => {
    setQrVisible(false)
    setQrDataUrl(null)
  }, [detailRoom?.id])

  const fetchRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        id,
        name,
        mode,
        type,
        status,
        visibility,
        owner_uid,
        created_at,
        room_members (
          id,
          online,
          seat_no,
          ready,
          member_type
        )
      `)
      .eq('status', 'open')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Fetch rooms error:', error)
      showToast({
        message: mapSupabaseErrorToMessage(error, '加载房间列表失败'),
        kind: 'error',
        timeoutMs: 6000,
        action: {
          label: '重试',
          onClick: async () => {
            if (isLoading) return
            hideToast()
            setIsLoading(true)
            try {
              await fetchRooms()
            } finally {
              setIsLoading(false)
            }
          }
        }
      })
    } else {
      setRooms(data || [])
    }
    setIsLoading(false)
  }, [hideToast, isLoading, showToast])

  const filteredRooms = rooms.filter(room => {
    const members = (room?.room_members || []) as Array<{ id: string; online?: boolean }>
    const memberCount = members.length
    const onlineCount = members.filter(m => m?.online === true).length

    if (onlyJoinable && memberCount >= 4) return false
    if (onlyHasOnline && onlineCount <= 0) return false
    return true
  })

  const sortedRooms = sortRooms(filteredRooms)

  useEffect(() => {
    let active = true
    let channel: any = null
    const fetchRoomsThrottled = throttle(() => {
      fetchRooms().catch(() => {})
    }, 400)

    ;(async () => {
      const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
      if (!ok) {
        if (active) setIsLoading(false)
        return
      }
      if (!active) return
      await fetchRooms()
      if (!active) return

      channel = supabase
        .channel('lobby_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'status=eq.open' }, () => {
          fetchRoomsThrottled()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
          fetchRoomsThrottled()
        })
        .subscribe((status: any) => {
          if (!active) return
          setRealtimeStatus(String(status))
        })
    })().catch(() => {
      if (active) setIsLoading(false)
    })

    return () => {
      active = false
      fetchRoomsThrottled.cancel()
      setRealtimeStatus('')
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchRooms, showToast])

  const handleCreate = async () => {
    if (!isPractice && !newRoomName.trim()) return

    setIsCreating(true)
    try {
      const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
      if (!ok) return

      let result
      if (isPractice) {
        result = await createPracticeRoom('public')
      } else {
        result = await createRoom(newRoomName, 'classic', 'pvp4', 'public')
      }

      if (result?.id) {
        router.push(`/room/${result.id}`)
      }
    } catch (e: any) {
      showToast({ message: mapSupabaseErrorToMessage(e, '创建失败'), kind: 'error' })
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoin = async (roomId: string) => {
    try {
      const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
      if (!ok) return
      setJoiningId(roomId)
      const { data: roomDetail, error: roomErr } = await supabase
        .from('rooms')
        .select(`id,status,room_members (id)`)
        .eq('id', roomId)
        .single()
      if (roomErr) {
        showToast({ message: mapSupabaseErrorToMessage(roomErr, '加载房间失败'), kind: 'error' })
        return
      }
      const memberCount = (roomDetail?.room_members || []).length
      if (roomDetail?.status !== 'open') {
        showToast({ message: '该房间对局进行中或已关闭，无法加入', kind: 'error' })
        return
      }
      if (memberCount >= 4) {
        showToast({ message: '房间已满，无法加入', kind: 'error' })
        return
      }
      try {
        await joinRoom(roomId)
      } catch (e: any) {
        showToast({ message: mapSupabaseErrorToMessage(e, '加入失败'), kind: 'error' })
        return
      }
      router.push(`/room/${roomId}`)
    } catch (e: any) {
      showToast({ message: mapSupabaseErrorToMessage(e, '加入失败'), kind: 'error' })
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen p-4 pt-20">
        {toastView}

        {/* 实时状态横幅 */}
        {realtimeStatus && realtimeStatus !== 'SUBSCRIBED' && (
          <div className="mb-4 max-w-[80rem] mx-auto px-4 py-2 bg-warning-500/20 backdrop-blur-sm rounded-lg border border-warning-500/50">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-amber-700">实时连接中... ({realtimeStatus})</span>
            </div>
          </div>
        )}

        <div className="max-w-80rem mx-auto px-4">
          {/* 头部区域 */}
          <header className="mb-8">
            <div className="flex flex-wrap justify-between items-start gap-4">
              {/* 标题区域 */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <BuildingIcon className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">对战大厅</h1>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">选择或创建房间开始对局</p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/friends')}
                  leftIcon={<UserGroupIcon className="w-4 h-4" />}
                >
                  好友
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/history')}
                >
                  战绩
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<RefreshIcon className="w-4 h-4" />}
                  onClick={async () => {
                    const now = Date.now()
                    if (now - lastRefreshAt < 1000) return
                    setLastRefreshAt(now)
                    setIsLoading(true)
                    try {
                      await fetchRooms()
                      showToast({ message: '已刷新', kind: 'info', timeoutMs: 1500 })
                    } finally {
                      setIsLoading(false)
                    }
                  }}
                  disabled={isLoading || Date.now() - lastRefreshAt < 1000}
                >
                  刷新
                </Button>
                <Badge variant="default" className="px-3 py-1">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    显示 <span className="font-semibold text-yellow-600 dark:text-yellow-400">{sortedRooms.length}</span>
                    <span className="text-neutral-400 mx-1">/</span>
                    <span>{rooms.length}</span>
                  </span>
                </Badge>
              </div>
            </div>
          </header>

          {/* 筛选和创建区域 */}
          <section className="mb-8 flex flex-wrap justify-between gap-4">
            {/* 筛选选项 */}
            <div className="flex gap-2 flex-wrap">
              <Switch
                checked={onlyJoinable}
                onChange={setOnlyJoinable}
                label="仅显示可加入"
                size="sm"
              />
              <Switch
                checked={onlyHasOnline}
                onChange={setOnlyHasOnline}
                label="仅显示有人在线"
                size="sm"
              />
            </div>

            {/* 创建房间 */}
            <div className="flex gap-2 flex-wrap items-center">
              <Switch
                checked={isPractice}
                onChange={setIsPractice}
                label="练习模式"
                size="sm"
              />
              {!isPractice && (
                <Input
                  placeholder="房间名称"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-48"
                  size="sm"
                />
              )}
              <Button
                onClick={handleCreate}
                disabled={isCreating || (!isPractice && !newRoomName.trim())}
                loading={isCreating}
                size="sm"
              >
                {isPractice ? '创建练习房' : '创建房间'}
              </Button>
            </div>
          </section>

          {/* 房间列表 */}
          <main>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedRooms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedRooms.map((room, index) => {
                  const members = (room?.room_members || []) as Array<{ online?: boolean }>
                  const memberCount = members.length
                  const onlineCount = members.filter(m => m?.online === true).length
                  const joinable = memberCount < 4

                  return (
                    <Card
                      key={room.id}
                      className={cn(
                        'transition-all duration-200',
                        'hover:-translate-y-1',
                        'hover:shadow-lg',
                        joinable ? 'border-primary-500' : 'border-neutral-300'
                      )}
                    >
                      {/* 卡片头部 */}
                      <div className="p-4 border-b border-neutral-200">
                        <div className="flex justify-between items-start gap-3">
                          <h3 className="font-semibold text-base truncate">{room.name || '未命名房间'}</h3>
                          <div className="flex gap-1">
                            <Badge variant="secondary" size="sm">{getTypeLabel(room.type)}</Badge>
                            <Badge variant="primary" size="sm">{getModeLabel(room.mode)}</Badge>
                          </div>
                        </div>
                      </div>

                      {/* 卡片内容 */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className={cn(
                            'w-3 h-3 rounded-full',
                            joinable ? 'bg-primary-500' : 'bg-neutral-400'
                          )} />
                          <span className={cn(
                            'text-sm font-medium',
                            joinable ? 'text-neutral-700' : 'text-neutral-500'
                          )}>
                            {joinable ? '可加入' : '已满'}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary-500" />
                            <span>玩家</span>
                            <span className="font-semibold text-primary-600">{memberCount}/4</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <OnlineIcon className="w-4 h-4 text-primary-500" />
                            <span>在线</span>
                            <span className="font-semibold text-primary-600">{onlineCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* 卡片底部 */}
                      <div className="p-4 pt-0">
                        <Button
                          onClick={() => handleJoin(room.id)}
                          disabled={!joinable || joiningId === room.id}
                          variant={joinable ? 'primary' : 'ghost'}
                          size="sm"
                          className="w-full"
                          loading={joiningId === room.id}
                        >
                          {joiningId === room.id ? '加入中...' : joinable ? '加入对局' : '已满'}
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-8 bg-white/5 backdrop-blur-sm rounded-2xl border-2 border-dashed border-white/20">
                <div className="w-20 h-20 mx-auto mb-4 bg-primary-100 border-2 border-primary-300 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="w-10 h-10 text-primary-500" />
                </div>
                <p className="text-lg font-medium text-neutral-700 mb-2">没有符合条件的房间</p>
                <p className="text-sm text-neutral-500">可以尝试取消筛选或创建新房间。</p>
              </div>
            )}
          </main>
        </div>

        {/* 房间详情 Modal */}
        <Modal
          open={detailRoom !== null}
          onOpenChange={(open) => !open && setDetailRoom(null)}
          title={detailRoom?.name || '房间详情'}
          size="md"
        >
          <ModalContent className="space-y-4">
            {/* 房间标签 */}
            <div className="flex gap-2">
              <Badge variant="primary">{detailRoom && getModeLabel(detailRoom.mode)}</Badge>
              <Badge variant="secondary">{detailRoom && getTypeLabel(detailRoom.type)}</Badge>
            </div>

            {/* 在线人数统计 */}
            {detailRoom && (
              <div className="flex items-center gap-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-3">
                  <OnlineIcon className="w-6 h-6 text-primary-500" />
                  <div>
                    <div className="text-xs text-neutral-600 mb-1">在线人数</div>
                    <div className="text-xl font-bold text-primary-600">
                      {(detailRoom.room_members || []).filter((m: any) => m?.online).length}
                      <span className="text-neutral-400 mx-1">/</span>
                      <span>{(detailRoom.room_members || []).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 成员列表 */}
            {detailRoom && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {(detailRoom.room_members || [])
                  .slice()
                  .sort((a: any, b: any) => (a.seat_no ?? 99) - (b.seat_no ?? 99))
                  .map((m: any, idx: number) => (
                    <div
                      key={m.id || idx}
                      className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      style={{
                        borderBottom: idx < (detailRoom.room_members || []).length - 1 ? '1px solid #e5e7eb' : 'none'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar alt={m.member_type === 'ai' ? 'AI' : '玩家'} size="sm" />
                        <div>
                          <div className="text-sm font-medium">
                            座位 {m.seat_no ?? '-'} · {m.member_type === 'ai' ? 'AI' : '真人'}
                          </div>
                          <div className="text-xs text-neutral-600 flex items-center gap-1">
                            {m.ready ? (
                              <>
                                <CheckCircleIcon className="w-3 h-3 text-success-500" />
                                <span>已准备</span>
                              </>
                            ) : (
                              <>
                                <span className="w-3 h-3 rounded-full bg-neutral-300" />
                                <span>未准备</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={m.online ? 'success' : 'default'}
                        size="sm"
                      >
                        {m.online ? '在线' : '离线'}
                      </Badge>
                    </div>
                  ))}
                {(detailRoom.room_members || []).length === 0 && (
                  <div className="p-8 text-center text-sm text-neutral-500">暂无成员</div>
                )}
              </div>
            )}
          </ModalContent>

          <ModalFooter className="flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setDetailRoom(null)}
            >
              关闭
            </Button>
            <Button
              onClick={async () => {
                const roomId = String(detailRoom?.id)
                const roomMembers = (detailRoom?.room_members || []) as Array<{ id: string }>
                const joinable = roomMembers.length < 4
                if (!joinable) return
                await handleJoin(roomId)
              }}
              disabled={joiningId === String(detailRoom?.id) || (detailRoom?.room_members || []).length >= 4}
              loading={joiningId === String(detailRoom?.id)}
              className="flex-1 min-w-[120px]"
            >
              {joiningId === String(detailRoom?.id) ? '加入中...' : '直接加入'}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!detailRoom) return
                const url = `${window.location.origin}/room/${detailRoom.id}`
                try {
                  await navigator.clipboard.writeText(url)
                  showToast({ message: '房间链接已复制', kind: 'success' })
                } catch {
                  showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
                }
              }}
            >
              复制链接
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!detailRoom) return
                const next = !qrVisible
                setQrVisible(next)
                if (!next) return
                if (qrDataUrl) return
                try {
                  const url = `${window.location.origin}/room/${detailRoom.id}`
                  const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 180 })
                  setQrDataUrl(dataUrl)
                } catch (e: any) {
                  showToast({ message: '二维码生成失败: ' + (e?.message || String(e)), kind: 'error' })
                }
              }}
            >
              {qrVisible ? '隐藏二维码' : '显示二维码'}
            </Button>
          </ModalFooter>

          {/* 二维码显示 */}
          {qrVisible && detailRoom && (
            <div className="mt-4 p-6 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
              {qrDataUrl ? (
                <Image
                  alt="房间二维码"
                  src={qrDataUrl}
                  width={180}
                  height={180}
                  unoptimized
                  className="mx-auto rounded-lg"
                />
              ) : (
                <div className="flex items-center justify-center gap-2 text-neutral-600">
                  <Spinner size="sm" />
                  <span>生成中...</span>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </SimpleEnvironmentBackground>
  )
}
