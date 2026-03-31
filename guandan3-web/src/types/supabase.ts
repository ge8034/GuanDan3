/**
 * Supabase相关类型定义
 */

/**
 * Supabase错误接口
 */
export interface SupabaseError {
  code?: string
  message?: string
  details?: string
  hint?: string
  status?: number
  error?: {
    code?: string
    message?: string
    status?: number
  }
}

/**
 * Realtime订阅状态
 */
export type RealtimeStatus = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'JOIN_ERROR'

/**
 * Realtime状态选项
 */
export interface RealtimeStatusOptions {
  onStatus?: (info: { name: string; status: string }) => void
}
