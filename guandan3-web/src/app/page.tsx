'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'

export default function Home() {
  const router = useRouter()
  // Use a state to hold user to prevent hydration mismatch
  const [currentUser, setCurrentUser] = useState<any>(null)
  const { user, setUser } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { showToast, toastView } = useToast()

  useEffect(() => {
    setIsClient(true)
    setCurrentUser(user)
  }, [user])

  const handleAnonymousLogin = async () => {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const { data, error } = await supabase.auth.signInAnonymously()
          if (error) throw error
          if (data.user) {
            setUser(data.user)
            return data.user
          }
        } catch (e) {
          if (attempt >= 2) throw e
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      showToast({ message: '登录失败: ' + (error as any).message, kind: 'error' })
      return null
    }
    return null
  }

  const handleLobbyEnter = async () => {
    setIsLoading(true)
    try {
      // Use useAuthStore directly here is fine as it's an event handler
      const storeUser = useAuthStore.getState().user
      if (!storeUser) {
        const u = await handleAnonymousLogin()
        if (!u) return
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
        const u = await handleAnonymousLogin()
        if (!u) {
          // Login failed, stop here
          return
        }
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
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
        >
          {isLoading ? '加载中...' : '练习房（1v3 AI）'}
        </button>
        
        <button
          onClick={handleLobbyEnter}
          disabled={isLoading}
          className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50"
        >
          {isLoading ? '加载中...' : '对战大厅（4人真人）'}
        </button>
      </div>
    </main>
  )
}
