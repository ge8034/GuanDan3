'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ChatRoomList from '@/components/chat/ChatRoomList'
import ChatWindow from '@/components/chat/ChatWindow'
import { type ChatRoom } from '@/lib/api/chat'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { MessageSquare, ArrowLeft } from 'lucide-react'

function ChatPageContent() {
  const router = useRouter()
  const { theme } = useTheme()
  const searchParams = useSearchParams()
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [rooms, setRooms] = useState<ChatRoom[]>([])

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const urlSelectedRoom = useMemo(() => {
    if (searchParams.has('user') && rooms.length > 0) {
      const targetUserId = searchParams.get('user')
      return rooms.find(r => r.other_user_uid === targetUserId) || null
    }
    return null
  }, [searchParams, rooms])

  const currentSelectedRoom = urlSelectedRoom || selectedRoom

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
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <MessageSquare style={{ width: '32px', height: '32px' }} />
              聊天
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
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回大厅
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* 聊天室列表 */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ChatRoomList
                selectedRoomId={currentSelectedRoom?.room_id || null}
                onSelectRoom={setSelectedRoom}
                onRoomsLoaded={setRooms}
              />
            </div>

            {/* 聊天窗口 */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                height: '600px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {currentUserId ? (
                <ChatWindow
                  room={currentSelectedRoom}
                  currentUserId={currentUserId}
                  className="h-[600px]"
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '600px' }}>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>
                    <p>加载中...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
        <div style={{ textAlign: 'center' }}>加载中...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
