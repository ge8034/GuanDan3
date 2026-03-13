'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { useRoomStore } from '@/lib/store/room'
import { useAuthStore } from '@/lib/store/auth'
import { useToast } from '@/lib/hooks/useToast'
import { modeLabel, typeLabel, sortRooms } from '@/lib/utils/lobby'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import QRCode from 'qrcode'

export default function LobbyPage() {
  const router = useRouter()
  const { createRoom, joinRoom } = useRoomStore()
  const { setUser } = useAuthStore()
  const [rooms, setRooms] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
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

  const ensureAuthed = useCallback(async (): Promise<boolean> => {
    const storeUser = useAuthStore.getState().user
    if (storeUser) return true

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const sessionUser = sessionData.session?.user ?? null
      if (sessionUser) {
        setUser(sessionUser)
        return true
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) throw error
          if (data.user) {
            setUser(data.user)
            return true
          }
        } catch (e) {
          if (attempt >= 2) throw e
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
        }
      }
    } catch (e: any) {
      showToast({ message: '登录失败: ' + (e?.message || String(e)), kind: 'error' })
      return false
    }

    return false
  }, [setUser, showToast])

  const fetchRooms = useCallback(async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select(`
        *,
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
      console.error('Fetch rooms error:', error)
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

    ;(async () => {
      await ensureAuthed()
      if (!active) return
      await fetchRooms()
      if (!active) return

      channel = supabase
        .channel('lobby_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: 'status=eq.open' }, () => {
          fetchRooms()
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_members' }, () => {
          fetchRooms()
        })
        .subscribe()
    })().catch(() => {
      if (active) setIsLoading(false)
    })

    return () => {
      active = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [ensureAuthed, fetchRooms])

  const handleCreate = async () => {
    if (!newRoomName.trim()) return
    setIsCreating(true)
    try {
       const ok = await ensureAuthed()
       if (!ok) return
       // Default to pvp4 classic public
       const result = await createRoom(newRoomName, 'classic', 'pvp4', 'public')
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
      const ok = await ensureAuthed()
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
    <div className="min-h-screen p-8 bg-gray-50 text-black">
      {toastView}

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">对战大厅</h1>
            <div className="flex gap-3 items-center">
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
                className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-50 transition shadow-sm"
              >
                刷新
              </button>
              <div className="text-sm text-gray-500">
                显示 {sortedRooms.length}/{rooms.length}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyJoinable}
                  onChange={e => setOnlyJoinable(e.target.checked)}
                />
                仅显示可加入
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={onlyHasOnline}
                  onChange={e => setOnlyHasOnline(e.target.checked)}
                />
                仅显示有人在线
              </label>
            </div>

            <div className="flex gap-4">
             <input 
               type="text" 
               placeholder="房间名称" 
               className="border p-2 rounded w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={newRoomName}
               onChange={e => setNewRoomName(e.target.value)}
             />
             <button 
               onClick={handleCreate}
               disabled={isCreating || !newRoomName.trim()}
               className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
             >
               {isCreating ? '创建中...' : '创建房间'}
             </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">加载房间列表...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedRooms.map(room => (
              (() => {
                const members = (room?.room_members || []) as Array<{ online?: boolean }>
                const memberCount = members.length
                const onlineCount = members.filter(m => m?.online === true).length
                const joinable = memberCount < 4
                return (
              <div key={room.id} data-room-id={room.id} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col justify-between h-48">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-gray-900 truncate pr-2" title={room.name}>{room.name || '未命名房间'}</h3>
                    <div className="flex gap-2">
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {typeLabel(room.type)}
                      </span>
                      <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full whitespace-nowrap">
                        {modeLabel(room.mode)}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-500 text-sm">
                   房间状态：{joinable ? '可加入' : '已满'}
                  </div>
                  <div className="text-gray-500 text-sm mt-1">
                   玩家：<span className="font-bold text-indigo-600">{memberCount}/4</span>
                   {'  '}
                   在线：
                   <span className="font-bold text-emerald-600">
                     {onlineCount}/{memberCount}
                   </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={!joinable || joiningId === room.id}
                  data-testid="lobby-join"
                  className="w-full bg-indigo-50 text-indigo-600 border border-indigo-200 py-2 rounded hover:bg-indigo-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {joiningId === room.id ? '加入中...' : (joinable ? '加入对局' : '已满')}
                </button>
                <button
                  onClick={() => setDetailRoom(room)}
                  data-testid="lobby-detail"
                  className="w-full mt-2 border border-gray-200 text-gray-700 py-2 rounded hover:bg-gray-50 transition"
                >
                  房间详情
                </button>
              </div>
                )
              })()
            ))}
            {sortedRooms.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-gray-400 mb-4">没有符合条件的房间</p>
                <p className="text-sm text-gray-400">可以尝试取消筛选或创建新房间。</p>
              </div>
            )}
          </div>
        )}
      </div>

      {detailRoom && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setDetailRoom(null)}
          onKeyDown={e => {
            if (e.key === 'Escape') setDetailRoom(null)
          }}
          tabIndex={-1}
        >
          <div
            data-testid="lobby-detail-modal"
            className="bg-white w-full max-w-xl rounded-2xl p-6 text-black shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-lg font-bold truncate max-w-[16rem]" title={detailRoom.name}>
                  {detailRoom.name || '未命名房间'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  模式：{modeLabel(detailRoom.mode)} · 类型：{typeLabel(detailRoom.type)}
                </div>
              </div>
              <button
                onClick={() => setDetailRoom(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                关闭
              </button>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-gray-600">
                在线：
                <span className="font-semibold text-emerald-600">
                  {(detailRoom.room_members || []).filter((m: any) => m?.online).length}
                </span>
                /
                <span className="font-semibold">
                  {(detailRoom.room_members || []).length}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    const roomId = String(detailRoom.id)
                    const roomMembers = (detailRoom.room_members || []) as Array<{ id: string }>
                    const joinable = roomMembers.length < 4
                    if (!joinable) return
                    await handleJoin(roomId)
                  }}
                  disabled={joiningId === String(detailRoom.id) || (detailRoom.room_members || []).length >= 4}
                  data-testid="lobby-detail-join"
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 transition"
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
                  data-testid="lobby-detail-copy"
                  className="border border-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition"
                >
                  复制房间链接
                </button>
              </div>

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
                className="text-indigo-600 hover:text-indigo-700 text-sm underline"
              >
                二维码邀请
              </button>
            </div>

            {qrVisible && (
              <div className="flex items-center justify-center mb-4">
                {qrDataUrl ? (
                  <Image alt="房间二维码" data-testid="lobby-detail-qr-img" src={qrDataUrl} width={180} height={180} unoptimized className="border rounded" />
                ) : (
                  <div className="text-sm text-gray-500">生成中...</div>
                )}
              </div>
            )}

            <div className="border rounded-lg divide-y">
              {(detailRoom.room_members || [])
                .slice()
                .sort((a: any, b: any) => (a.seat_no ?? 99) - (b.seat_no ?? 99))
                .map((m: any, idx: number) => (
                  <div key={m.id || idx} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {m.member_type === 'ai' ? '🤖' : '👤'}
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">
                          座位 {m.seat_no ?? '-'} · {m.member_type === 'ai' ? 'AI' : '真人'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {m.ready ? '已准备' : '未准备'}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${m.online ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {m.online ? '在线' : '离线'}
                    </div>
                  </div>
                ))}
              {(detailRoom.room_members || []).length === 0 && (
                <div className="p-4 text-sm text-gray-500 text-center">暂无成员</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
