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
import { Avatar } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { BuildingIcon, RefreshIcon, UserGroupIcon, OnlineIcon, CheckCircleIcon, DocumentIcon } from '@/components/icons/LandscapeIcons'
import { Loader2, X } from 'lucide-react'
import { logger } from '@/lib/utils/logger'

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
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        padding: '1rem',
        height: '180px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    />
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

       let result;
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
      <div style={{ minHeight: '100vh', padding: '1rem', paddingTop: '80px' }}>
        {toastView}

        {/* 实时状态横幅 */}
        {realtimeStatus && realtimeStatus !== 'SUBSCRIBED' && (
          <div style={{
            marginBottom: '1rem',
            maxWidth: '80rem',
            margin: '0 auto 1rem',
            backgroundColor: 'rgba(217, 119, 6, 0.2)',
            backdropFilter: 'blur(4px)',
            borderRadius: '12px',
            border: '2px solid rgba(251, 191, 36, 0.5)',
            padding: '0.5rem 1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.875rem', color: '#fed7aa' }}>实时连接中... ({realtimeStatus})</span>
            </div>
          </div>
        )}

        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* 头部区域 */}
          <header
            style={{
              marginBottom: '2rem',
              animation: 'fadeIn 0.3s ease-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              {/* 标题区域 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    background: 'linear-gradient(135deg, #408040 0%, #1a472a 100%)',
                    border: '2px solid #d4af37',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <BuildingIcon style={{ width: '32px', height: '32px', color: '#d4af37' }} />
                </div>
                <div>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                    对战大厅
                  </h1>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                    选择或创建房间开始对局
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => router.push('/friends')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
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
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <UserGroupIcon style={{ width: '16px', height: '16px' }} />
                  好友
                </button>
                <button
                  onClick={() => router.push('/history')}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
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
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  战绩
                </button>
                <button
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
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: (isLoading || Date.now() - lastRefreshAt < 1000) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '36px',
                    opacity: (isLoading || Date.now() - lastRefreshAt < 1000) ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && Date.now() - lastRefreshAt >= 1000) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <RefreshIcon style={{ width: '16px', height: '16px', animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
                  刷新
                </button>
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                }}>
                  <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                    显示 <span style={{ fontWeight: 700, color: '#d4af37' }}>{sortedRooms.length}</span>
                    <span style={{ color: '#9ca3af', margin: '0 0.25rem' }}>/</span>
                    <span style={{ color: '#9ca3af' }}>{rooms.length}</span>
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 筛选和创建区域 */}
          <section
            style={{
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              animation: 'fadeIn 0.3s ease-out 0.1s both'
            }}
          >
            {/* 筛选选项 */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyJoinable}
                  onChange={(e) => setOnlyJoinable(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>仅显示可加入</span>
              </label>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyHasOnline}
                  onChange={(e) => setOnlyHasOnline(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>仅显示有人在线</span>
              </label>
            </div>

            {/* 创建房间 */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <input
                  type="checkbox"
                  checked={isPractice}
                  onChange={(e) => setIsPractice(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>练习模式</span>
              </label>
              {!isPractice && (
                <input
                  type="text"
                  placeholder="房间名称"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    color: '#111827',
                    fontSize: '0.9375rem',
                    width: '180px',
                  }}
                />
              )}
              <button
                onClick={handleCreate}
                disabled={isCreating || (!isPractice && !newRoomName.trim())}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: '2px solid #1a472a',
                  backgroundColor: '#1a472a',
                  color: 'white',
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  cursor: (isCreating || (!isPractice && !newRoomName.trim())) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: (isCreating || (!isPractice && !newRoomName.trim())) ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (isPractice || newRoomName.trim()) {
                    e.currentTarget.style.backgroundColor = '#2d5a3d'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a472a'
                }}
              >
                {isCreating ? '创建中...' : isPractice ? '创建练习房' : '创建房间'}
              </button>
            </div>
          </section>

          {/* 房间列表 */}
          <main>
            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedRooms.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {sortedRooms.map((room, index) => {
                  const members = (room?.room_members || []) as Array<{ online?: boolean }>
                  const memberCount = members.length
                  const onlineCount = members.filter(m => m?.online === true).length
                  const joinable = memberCount < 4

                  return (
                    <article
                      key={room.id}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        border: '2px solid ' + (joinable ? '#2d5a3d' : '#d1d5db'),
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        overflow: 'hidden',
                        animation: `fadeIn 0.3s ease-out ${index * 50}ms both`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.15)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {/* 卡片头部 */}
                      <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#111827', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {room.name || '未命名房间'}
                          </h3>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: '#f3f4f6',
                                color: '#374151',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              {getTypeLabel(room.type)}
                            </span>
                            <span
                              style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: '#d4af37',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}
                            >
                              {getModeLabel(room.mode)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 卡片内容 */}
                      <div style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: joinable ? '#d4af37' : '#9ca3af',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#374151' }}>
                            {joinable ? '可加入' : '已满'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <UserGroupIcon style={{ width: '16px', height: '16px', color: '#d4af37' }} />
                            <span style={{ color: '#6b7280' }}>玩家</span>
                            <span style={{ fontWeight: 600, color: '#d4af37' }}>{memberCount}/4</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <OnlineIcon style={{ width: '16px', height: '16px', color: '#d4af37' }} />
                            <span style={{ color: '#6b7280' }}>在线</span>
                            <span style={{ fontWeight: 600, color: '#d4af37' }}>{onlineCount}</span>
                          </div>
                        </div>
                      </div>

                      {/* 卡片底部 */}
                      <div style={{ padding: '0 1rem 1rem' }}>
                        <button
                          onClick={() => handleJoin(room.id)}
                          disabled={!joinable || joiningId === room.id}
                          style={{
                            width: '100%',
                            padding: '0.625rem',
                            borderRadius: '8px',
                            border: '2px solid ' + (joinable ? '#1a472a' : 'transparent'),
                            backgroundColor: joinable ? '#1a472a' : 'transparent',
                            color: joinable ? 'white' : '#9ca3af',
                            fontSize: '0.9375rem',
                            fontWeight: 500,
                            cursor: (joinable && joiningId !== room.id) ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            opacity: (!joinable || joiningId === room.id) ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (joinable && joiningId !== room.id) {
                              e.currentTarget.style.backgroundColor = '#2d5a3d'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = joinable ? '#1a472a' : 'transparent'
                          }}
                        >
                          {joiningId === room.id ? '加入中...' : joinable ? '加入对局' : '已满'}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                }}
              >
                <div style={{ width: '80px', height: '80px', margin: '0 auto 1rem', backgroundColor: 'rgba(212, 175, 55, 0.2)', border: '2px solid rgba(212, 175, 55, 0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleIcon style={{ width: '40px', height: '40px', color: '#d4af37' }} />
                </div>
                <p style={{ fontSize: '1rem', color: '#e5e7eb', marginBottom: '0.5rem', fontWeight: 500 }}>没有符合条件的房间</p>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>可以尝试取消筛选或创建新房间。</p>
              </div>
            )}
          </main>
        </div>

        {/* 房间详情弹窗 */}
        {detailRoom && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setDetailRoom(null)}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                maxWidth: '500px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>{detailRoom.name || '未命名房间'}</h2>
                <button
                  onClick={() => setDetailRoom(null)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#d4af37',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    {getModeLabel(detailRoom.mode)}
                  </span>
                  <span
                    style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      fontSize: '0.75rem',
                      fontWeight: 500
                    }}
                  >
                    {getTypeLabel(detailRoom.type)}
                  </span>
                </div>

                {/* 在线人数统计 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1rem', border: '2px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <OnlineIcon style={{ width: '24px', height: '24px', color: '#d4af37' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>在线人数</div>
                      <div style={{ fontWeight: 700, color: '#d4af37', fontSize: '1.125rem' }}>
                        {(detailRoom.room_members || []).filter((m: any) => m?.online).length}
                        <span style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0.25rem' }}>/</span>
                        <span style={{ color: '#1f2937', fontSize: '1.125rem' }}>{(detailRoom.room_members || []).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 成员列表 */}
                <div style={{ border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
                  {(detailRoom.room_members || [])
                    .slice()
                    .sort((a: any, b: any) => (a.seat_no ?? 99) - (b.seat_no ?? 99))
                    .map((m: any, idx: number) => (
                    <div
                      key={m.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem',
                        borderBottom: idx < (detailRoom.room_members || []).length - 1 ? '1px solid #e5e7eb' : 'none',
                        transition: 'background-color 0.15s ease-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Avatar alt={m.member_type === 'ai' ? 'AI' : '玩家'} size="sm" />
                        <div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: '#111827' }}>
                            座位 {m.seat_no ?? '-'} · {m.member_type === 'ai' ? 'AI' : '真人'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            {m.ready ? (
                              <>
                                <svg style={{ width: '12px', height: '12px', color: '#22c55e' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span style={{ marginLeft: '0.25rem' }}>已准备</span>
                              </>
                            ) : (
                              <>
                                <svg style={{ width: '12px', height: '12px', color: '#9ca3af' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span style={{ marginLeft: '0.25rem' }}>未准备</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: m.online ? '#22c55e' : '#9ca3af',
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        {m.online ? '在线' : '离线'}
                      </span>
                    </div>
                  ))}
                  {(detailRoom.room_members || []).length === 0 && (
                    <div style={{ padding: '2rem', fontSize: '0.875rem', color: '#6b7280', textAlign: 'center' }}>暂无成员</div>
                  )}
                </div>
              </div>

              {/* 弹窗底部 */}
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <button
                  onClick={async () => {
                    const roomId = String(detailRoom.id)
                    const roomMembers = (detailRoom.room_members || []) as Array<{ id: string }>
                    const joinable = roomMembers.length < 4
                    if (!joinable) return
                    await handleJoin(roomId)
                  }}
                  disabled={joiningId === String(detailRoom.id) || (detailRoom.room_members || []).length >= 4}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: '2px solid #1a472a',
                    backgroundColor: '#1a472a',
                    color: 'white',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: (joiningId === String(detailRoom.id) || (detailRoom.room_members || []).length >= 4) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    opacity: (joiningId === String(detailRoom.id) || (detailRoom.room_members || []).length >= 4) ? 0.5 : 1,
                    minWidth: '120px',
                  }}
                  onMouseEnter={(e) => {
                    if (joiningId !== String(detailRoom.id) && (detailRoom.room_members || []).length < 4) {
                      e.currentTarget.style.backgroundColor = '#2d5a3d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1a472a'
                  }}
                >
                  {joiningId === String(detailRoom.id) ? '加入中...' : '直接加入'}
                </button>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/room/${detailRoom.id}`
                    try {
                      await navigator.clipboard.writeText(url)
                      showToast({ message: '房间链接已复制', kind: 'success' })
                    } catch {
                      showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    minWidth: '120px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.borderColor = '#2d5a3d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  复制房间链接
                </button>
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
                  style={{
                    flex: 1,
                    padding: '0.625rem',
                    borderRadius: '8px',
                    border: '2px solid #d1d5db',
                    backgroundColor: 'transparent',
                    color: '#374151',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    minWidth: '120px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                    e.currentTarget.style.borderColor = '#2d5a3d'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.borderColor = '#d1d5db'
                  }}
                >
                  {qrVisible ? '隐藏二维码' : '显示二维码'}
                </button>
              </div>

              {qrVisible && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', borderRadius: '12px', padding: '1.5rem', border: '2px solid #e5e7eb' }}>
                  {qrDataUrl ? (
                    <Image
                      alt="房间二维码"
                      src={qrDataUrl}
                      width={180}
                      height={180}
                      unoptimized
                      style={{ borderRadius: '8px' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                      <span>生成中...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
