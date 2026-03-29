import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'

type EnsureAuthedOptions = {
  retries?: number
  backoffMs?: number
  onError?: (message: string, error: unknown) => void
}

export const ensureAuthed = async (options: EnsureAuthedOptions = {}): Promise<{ ok: boolean; user: User | null }> => {
  const { retries = 3, backoffMs = 300, onError } = options

  const storeUser = useAuthStore.getState().user
  if (storeUser) return { ok: true, user: storeUser }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
    if (sessionErr) throw sessionErr
    const sessionUser = sessionData.session?.user ?? null
    if (sessionUser) {
      useAuthStore.getState().setUser(sessionUser)
      return { ok: true, user: sessionUser }
    }

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) throw error

        // 确保user和session都存在
        if (data.user && data.session) {
          useAuthStore.getState().setUser(data.user)
          // 等待一小段时间确保session被保存到localStorage并准备好用于后续请求
          // 这对于RPC调用需要auth.uid()正常工作很重要
          await sleep(100)
          return { ok: true, user: data.user }
        }

        // 如果user存在但session不存在，尝试获取session
        if (data.user && !data.session) {
          const { data: sessionData } = await supabase.auth.getSession()
          if (sessionData.session) {
            useAuthStore.getState().setUser(data.user)
            return { ok: true, user: data.user }
          }
        }
      } catch (e) {
        if (attempt >= retries - 1) throw e
        await sleep(backoffMs * (attempt + 1))
      }
    }
  } catch (e: any) {
    const msg = '登录失败: ' + (e?.message || String(e))
    onError?.(msg, e)
    return { ok: false, user: null }
  }

  return { ok: false, user: null }
}

