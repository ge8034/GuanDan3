'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRoomStore } from '@/lib/store/room'
import { useToast } from '@/lib/hooks/useToast'
import { modeLabel, typeLabel, sortRooms } from '@/lib/utils/lobby'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { throttle } from '@/lib/utils/throttle'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/Button'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import FadeIn from '@/components/ui/FadeIn'
import { RippleEffect } from '@/components/effects/RippleEffect.lazy'
import ScaleIn from '@/components/ui/ScaleIn'
import { StaggerContainer } from '@/components/ui/StaggerContainer.lazy'
import CloudMountainBackground from '@/components/backgrounds/CloudMountainBackground'
import { BuildingIcon, RefreshIcon, UserGroupIcon, OnlineIcon, CheckCircleIcon, DocumentIcon } from '@/components/icons/LandscapeIcons'

import { logger } from '@/lib/utils/logger'
export default function LobbyPage() {
  const router = useRouter()
  const { createRoom, createPracticeRoom, joinRoom } = useRoomStore()
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [isPractice, setIsPractice] = useState(false)
  const [onlyJoinable, setOnlyJoinable] = useState(true)
  const [onlyHasOnline, setOnlyHasOnline] = useState(false)
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [detailRoom, setDetailRoom] = useState<any | null>(null)
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
    // if (!newRoomName.trim()) return // Practice room auto-names?
    if (!isPractice && !newRoomName.trim()) return
    
    setIsCreating(true)
    try {
       const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
       if (!ok) return
       
       let result;
       if (isPractice) {
          result = await createPracticeRoom('public')
       } else {
          // Default to pvp4 classic public
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
    <CloudMountainBackground>
      <div className="min-h-screen p-4 md:p-8 text-black">
        {toastView}
        {realtimeStatus && realtimeStatus !== 'SUBSCRIBED' && (
          <div data-testid="lobby-realtime-banner" className="mb-4 max-w-6xl mx-auto bg-yellow-100/90 backdrop-blur-sm border border-yellow-300 text-yellow-900 px-4 py-2 rounded-lg shadow-sm">
            实时连接状态：{realtimeStatus}
          </div>
        )}

      <div className="max-w-6xl mx-auto">
        <FadeIn delay={0.1}>
          <div className="flex flex-col gap-4 md:gap-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#6BA539] to-[#A8C8A8] rounded-xl flex items-center justify-center shadow-lg">
                  <BuildingIcon size="md" className="text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-semibold bg-gradient-to-r from-[#6BA539] to-[#A8C8A8] bg-clip-text text-transparent">对战大厅</h1>
              </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                onClick={() => router.push('/friends')}
                variant="outline"
                size="sm"
                className="border-[#D3D3D3] text-[#6BA539] hover:bg-[#F5F5DC]/50"
              >
                <UserGroupIcon size="sm" className="mr-1" />
                好友
              </Button>
              <Button
                onClick={() => router.push('/history')}
                variant="outline"
                size="sm"
                className="border-[#D3D3D3] text-[#6BA539] hover:bg-[#F5F5DC]/50"
              >
                <DocumentIcon size="sm" className="mr-1" />
                战绩
              </Button>
              <Button
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
                variant="outline"
                size="sm"
                data-testid="lobby-refresh"
                className="border-[#D3D3D3] text-[#6BA539] hover:bg-[#F5F5DC]/50"
              >
                <RefreshIcon size="sm" className="mr-1" />
                刷新
              </Button>
              <div className="text-sm text-gray-700 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#D3D3D3]">
                显示 <span className="font-semibold text-[#6BA539]">{sortedRooms.length}</span>/{rooms.length}
              </div>
            </div>
          </div>
        </div>
        </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#D3D3D3] hover:border-[#6BA539] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyJoinable}
                    onChange={e => setOnlyJoinable(e.target.checked)}
                    data-testid="lobby-filter-joinable"
                    className="w-4 h-4 text-[#6BA539] rounded focus:ring-[#6BA539]"
                  />
                  仅显示可加入
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#D3D3D3] hover:border-[#6BA539] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyHasOnline}
                    onChange={e => setOnlyHasOnline(e.target.checked)}
                    data-testid="lobby-filter-online"
                    className="w-4 h-4 text-[#6BA539] rounded focus:ring-[#6BA539]"
                  />
                  仅显示有人在线
                </label>
              </div>

              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex items-center gap-2 text-sm text-gray-700 select-none bg-white/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-[#D3D3D3] hover:border-[#6BA539] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPractice}
                    onChange={e => setIsPractice(e.target.checked)}
                    data-testid="lobby-create-practice"
                    className="w-4 h-4 text-[#6BA539] rounded focus:ring-[#6BA539]"
                  />
                  练习模式 (AI对战)
                </label>
                {!isPractice && (
                  <Input 
                    placeholder="房间名称" 
                    data-testid="lobby-create-name"
                    value={newRoomName}
                    onChange={e => setNewRoomName(e.target.value)}
                    className="w-48 md:w-64"
                  />
                )}
                <Button 
                  onClick={handleCreate}
                  disabled={isCreating || (!isPractice && !newRoomName.trim())}
                  isLoading={isCreating}
                  data-testid="lobby-create"
                  className="bg-gradient-to-r from-[#6BA539] to-[#A8C8A8] hover:from-[#5a9430] hover:to-[#8fb890] shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {isPractice ? '创建练习房间' : '创建房间'}
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-700">加载房间列表...</div>
        ) : (
          <StaggerContainer staggerDelay={0.1}>
            {sortedRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {sortedRooms.map((room, index) => (
                (() => {
                  const members = (room?.room_members || []) as Array<{ online?: boolean }>
                  const memberCount = members.length
                  const onlineCount = members.filter(m => m?.online === true).length
                  const joinable = memberCount < 4
                  return (
                  <ScaleIn key={room.id} delay={index * 0.1}>
                    <Card data-room-id={room.id} hover className="bg-white/80 backdrop-blur-sm border-[#D3D3D3] shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-lg md:text-xl text-gray-900 truncate pr-2" title={room.name}>{room.name || '未命名房间'}</h3>
                        <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
                          <Badge variant="secondary" size="sm" className="text-xs">
                            {typeLabel(room.type)}
                          </Badge>
                          <Badge variant="primary" size="sm" className="text-xs">
                            {modeLabel(room.mode)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${joinable ? 'bg-[#6BA539]' : 'bg-red-500'}`}></div>
                        <span className="text-gray-700 text-sm font-medium">
                          {joinable ? '可加入' : '已满'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <UserGroupIcon size="sm" className="text-[#6BA539]" />
                          <span className="text-gray-700">玩家：</span>
                          <span className="font-bold text-[#6BA539]">{memberCount}/4</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <OnlineIcon size="sm" className="text-[#6BA539]" />
                          <span className="text-gray-700">在线：</span>
                          <span className="font-bold text-[#6BA539]">
                            {onlineCount}/{memberCount}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                    <CardFooter>
                      <div className="flex flex-col gap-2 w-full">
                        <Button
                          onClick={() => handleJoin(room.id)}
                          disabled={!joinable || joiningId === room.id}
                          isLoading={joiningId === room.id}
                          fullWidth
                          data-testid="lobby-join"
                          className={joinable 
                            ? "bg-gradient-to-r from-[#6BA539] to-[#A8C8A8] hover:from-[#5a9430] hover:to-[#8fb890] shadow-md hover:shadow-lg transition-all duration-300"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }
                        >
                          {joinable ? '加入对局' : '已满'}
                        </Button>
                        <Button
                          onClick={() => setDetailRoom(room)}
                          variant="outline"
                          fullWidth
                          size="sm"
                          data-testid="lobby-detail"
                          className="border-[#D3D3D3] text-[#6BA539] hover:bg-[#F5F5DC]/50"
                        >
                          房间详情
                        </Button>
                      </div>
                    </CardFooter>
                    </Card>
                  </ScaleIn>
                    )
                })()
              ))}
              </div>
            ) : (
              <FadeIn delay={0.3}>
                <div className="col-span-full text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-[#D3D3D3]">
                  <div className="w-16 h-16 mx-auto mb-4 bg-[#F5F5DC] rounded-full flex items-center justify-center">
                    <CheckCircleIcon size="lg" className="text-[#6BA539]" />
                  </div>
                  <p className="text-gray-700 mb-2 font-medium">没有符合条件的房间</p>
                  <p className="text-sm text-gray-600">可以尝试取消筛选或创建新房间。</p>
                </div>
              </FadeIn>
            )}
          </StaggerContainer>
        )}
      </div>

      <Modal
        isOpen={!!detailRoom}
        onClose={() => setDetailRoom(null)}
        title={detailRoom?.name || '未命名房间'}
        size="lg"
      >
        {detailRoom && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="primary" size="sm">
                {modeLabel(detailRoom.mode)}
              </Badge>
              <Badge variant="secondary" size="sm">
                {typeLabel(detailRoom.type)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-6 bg-[#F5F5DC]/50 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <OnlineIcon size="sm" className="text-[#6BA539]" />
                <span className="text-sm text-gray-700">在线：</span>
                <span className="font-semibold text-[#6BA539]">
                  {(detailRoom.room_members || []).filter((m: any) => m?.online).length}
                </span>
                <span className="text-gray-400">/</span>
                <span className="font-semibold text-gray-700">
                  {(detailRoom.room_members || []).length}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Button
                onClick={async () => {
                  const roomId = String(detailRoom.id)
                  const roomMembers = (detailRoom.room_members || []) as Array<{ id: string }>
                  const joinable = roomMembers.length < 4
                  if (!joinable) return
                  await handleJoin(roomId)
                }}
                disabled={joiningId === String(detailRoom.id) || (detailRoom.room_members || []).length >= 4}
                isLoading={joiningId === String(detailRoom.id)}
                data-testid="lobby-detail-join"
                className="bg-gradient-to-r from-[#6BA539] to-[#A8C8A8] hover:from-[#5a9430] hover:to-[#8fb890] shadow-md hover:shadow-lg transition-all duration-300"
              >
                直接加入
              </Button>
              <Button
                onClick={async () => {
                  const url = `${window.location.origin}/room/${detailRoom.id}`
                  try {
                    await navigator.clipboard.writeText(url)
                    showToast({ message: '房间链接已复制', kind: 'success' })
                  } catch {
                    showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
                  }
                }}
                variant="outline"
                data-testid="lobby-detail-copy"
                className="border-[#D3D3D3] text-[#6BA539] hover:bg-[#F5F5DC]/50"
              >
                复制房间链接
              </Button>
              <RippleEffect className="relative inline-block">
                <button
                  onClick={async () => {
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
                  data-testid="lobby-detail-qr"
                  className="text-[#6BA539] hover:text-[#5a9430] text-sm font-medium hover:underline transition-all"
                >
                  二维码邀请
                </button>
              </RippleEffect>
            </div>

            {qrVisible && (
              <div className="flex items-center justify-center mb-6 bg-white rounded-lg p-4 border border-[#D3D3D3]">
                {qrDataUrl ? (
                  <Image alt="房间二维码" data-testid="lobby-detail-qr-img" src={qrDataUrl} width={180} height={180} unoptimized className="rounded-lg" />
                ) : (
                  <div className="text-sm text-gray-500">生成中...</div>
                )}
              </div>
            )}

            <div className="border border-[#D3D3D3] rounded-lg divide-y divide-[#D3D3D3]/50 bg-white/50">
              {(detailRoom.room_members || [])
                .slice()
                .sort((a: any, b: any) => (a.seat_no ?? 99) - (b.seat_no ?? 99))
                .map((m: any, idx: number) => (
                  <div key={m.id || idx} className="flex items-center justify-between p-4 hover:bg-[#F5F5DC]/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={m.member_type === 'ai' ? 'AI' : '玩家'}
                        size="sm"
                      />
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          座位 {m.seat_no ?? '-'} · {m.member_type === 'ai' ? 'AI' : '真人'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          {m.ready ? (
                            <>
                              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              已准备
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              未准备
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={m.online ? 'success' : 'secondary'} size="sm">
                      {m.online ? '在线' : '离线'}
                    </Badge>
                  </div>
                ))}
              {(detailRoom.room_members || []).length === 0 && (
                <div className="p-8 text-sm text-gray-500 text-center">暂无成员</div>
              )}
            </div>
          </>
          )}
      </Modal>
    </CloudMountainBackground>
  )
}
