import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'

/**
 * 确保用户已认证的选项
 */
type EnsureAuthedOptions = {
  /** 重试次数，默认 3 次 */
  retries?: number
  /** 重试退避时间（毫秒），默认 300ms */
  backoffMs?: number
  /** 错误回调函数 */
  onError?: (message: string, error: unknown) => void
}

/**
 * 确保用户已认证
 *
 * 检查用户登录状态，如果未登录则执行匿名登录。
 * 支持重试机制和错误回调，用于在需要认证的操作前确保用户身份。
 *
 * @param options - 配置选项
 * @returns 包含认证状态和用户信息的对象
 *
 * @example
 * ```ts
 * // 基础用法
 * const { ok, user } = await ensureAuthed()
 * if (!ok) {
 *   console.error('认证失败')
 *   return
 * }
 * console.log('用户已登录:', user.id)
 * ```
 *
 * @example
 * ```ts
 * // 带错误回调
 * const { ok } = await ensureAuthed({
 *   onError: (msg) => showToast({ message: msg, kind: 'error' })
 * })
 * ```
 *
 * @example
 * ```ts
 * // 自定义重试
 * const { ok } = await ensureAuthed({
 *   retries: 5,
 *   backoffMs: 500
 * })
 * ```
 *
 * @remarks
 * 认证流程：
 * 1. 检查 store 中是否已有用户
 * 2. 尝试从 Supabase 获取当前 session
 * 3. 如果未认证，执行匿名登录
 * 4. 支持重试机制，每次重试间隔递增
 */
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
  } catch (e: unknown) {
    const msg = '登录失败: ' + ((e instanceof Error ? e.message : null) || String(e))
    onError?.(msg, e)
    return { ok: false, user: null }
  }

  return { ok: false, user: null }
}
