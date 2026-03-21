'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ChatRoomList from '@/components/chat/ChatRoomList'
import ChatWindow from '@/components/chat/ChatWindow'
import { type ChatRoom } from '@/lib/api/chat'

function ChatPageContent() {
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-6">聊天</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ChatRoomList
              selectedRoomId={currentSelectedRoom?.room_id || null}
              onSelectRoom={setSelectedRoom}
              onRoomsLoaded={setRooms}
            />
          </div>
          
          <div className="lg:col-span-2">
            {currentUserId ? (
              <ChatWindow
                room={currentSelectedRoom}
                currentUserId={currentUserId}
                className="h-[600px]"
              />
            ) : (
              <div className="bg-card rounded-xl border border-border flex items-center justify-center h-[600px]">
                <div className="text-center text-text-secondary">
                  <p>加载中...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><div className="text-center">加载中...</div></div>}>
      <ChatPageContent />
    </Suspense>
  )
}
