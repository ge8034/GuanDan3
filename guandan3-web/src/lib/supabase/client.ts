import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 必须设置'
  )
}

/**
 * Supabase 客户端实例
 *
 * 预配置的 Supabase 客户端，用于所有数据库操作和实时订阅。
 *
 * @example
 * ```ts
 * // 数据库查询
 * const { data, error } = await supabase
 *   .from('rooms')
 *   .select()
 *   .eq('status', 'open')
 *
 * // 实时订阅
 * const channel = supabase
 *   .channel('room-updates')
 *   .on('postgres_changes', { event: 'INSERT', table: 'rooms' }, (payload) => {
 *     console.log('New room:', payload.new)
 *   })
 *   .subscribe()
 *
 * // 认证操作
 * const { data } = await supabase.auth.signInAnonymously()
 * ```
 *
 * @remarks
 * 配置说明：
 * - **超时**: 60 秒请求超时
 * - **实时**: 每秒最多 10 个事件
 * - **会话持久化**: 启用，存储在 localStorage
 * - **自动刷新令牌**: 启用
 * - **URL 检测**: 启用（支持 OAuth 回调）
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      // 使用 AbortController 实现超时（兼容性更好）
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))
    },
  },
  // 启用实时功能
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // 认证配置
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // SSR安全检查：只在客户端使用localStorage
    ...(typeof window !== 'undefined' ? {
      storage: window.localStorage,
      storageKey: 'guandan3-auth-token',
    } : {}),
  },
})

export type { SupabaseClient }
