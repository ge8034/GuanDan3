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
        if (data.user) {
          useAuthStore.getState().setUser(data.user)
          return { ok: true, user: data.user }
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

