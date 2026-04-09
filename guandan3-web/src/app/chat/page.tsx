/**
 * Chat 聊天页面
 * 使用设计系统组件重构版本
 */

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
import { MessageSquare } from 'lucide-react'
import { Button } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'

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
      <div className="min-h-screen pt-20">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur-md border-b-2 border-black/10">
          <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8" />
              聊天
            </h1>
            <Button
              onClick={() => router.push('/lobby')}
              variant="ghost"
              size="sm"
              leftIcon={<MessageSquare className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 聊天室列表 */}
            <Card className="bg-white/90 backdrop-blur-md h-[600px] flex flex-col">
              <ChatRoomList
                selectedRoomId={currentSelectedRoom?.room_id || null}
                onSelectRoom={setSelectedRoom}
                onRoomsLoaded={setRooms}
              />
            </Card>

            {/* 聊天窗口 */}
            <Card className="bg-white/90 backdrop-blur-md h-[600px] flex flex-col">
              {currentUserId ? (
                <ChatWindow
                  room={currentSelectedRoom}
                  currentUserId={currentUserId}
                  className="h-[600px]"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-neutral-600">
                    <p>加载中...</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-20">
        <div className="text-center">加载中...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}
