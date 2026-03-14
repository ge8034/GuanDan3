'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'

export default function Home() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { showToast, toastView } = useToast()

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleLobbyEnter = async () => {
    setIsLoading(true)
    try {
      // Use useAuthStore directly here is fine as it's an event handler
      const storeUser = useAuthStore.getState().user
      if (!storeUser) {
        const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        if (!ok) return
      }
      router.push('/lobby')
    } finally {
      setIsLoading(false)
    }
  }

  const createPracticeRoom = async () => {
    setIsLoading(true)
    try {
      const storeUser = useAuthStore.getState().user
      if (!storeUser) {
        const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        if (!ok) return
      }
      
      const { data, error } = await supabase.rpc('create_practice_room', {
        p_visibility: 'private'
      })
      
      if (error) {
        console.error('Create room failed:', error)
        showToast({ message: mapSupabaseErrorToMessage(error, '创建房间失败'), kind: 'error' })
        return
      }
      
      const roomId = data?.[0]?.room_id
      if (roomId) {
        router.push(`/room/${roomId}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    // Return a simple loading or placeholder during SSR/Hydration
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
         {toastView}
         <h1 className="text-4xl font-bold">掼蛋 3</h1>
         <div className="animate-pulse">加载中...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
      {toastView}
      <h1 className="text-4xl font-bold">掼蛋 3</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={createPracticeRoom}
          disabled={isLoading}
          data-testid="home-practice"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isLoading ? '加载中...' : '练习房（1v3 AI）'}
        </button>
        
        <button
          onClick={handleLobbyEnter}
          disabled={isLoading}
          data-testid="home-enter-lobby"
          className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50"
        >
          {isLoading ? '加载中...' : '对战大厅（4人真人）'}
        </button>
      </div>
    </main>
  )
}
