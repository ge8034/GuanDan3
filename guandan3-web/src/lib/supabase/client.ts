import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量: NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 必须设置'
  )
}

// 配置超时和全局错误处理
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options) => {
      // 使用AbortController实现超时（兼容性更好）
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
    // 会话存储配置
    storage: window.localStorage,
    storageKey: 'guandan3-auth-token',
  },
})

export type { SupabaseClient }
