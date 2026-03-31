import type { SupabaseError } from '@/types/supabase'

/**
 * 将Supabase错误映射为用户友好的错误消息
 */
export const mapSupabaseErrorToMessage = (error: unknown, fallback: string): string => {
  // 类型守卫：检查是否为SupabaseError
  const isSupabaseError = (err: unknown): err is SupabaseError => {
    return (
      typeof err === 'object' &&
      err !== null &&
      ('code' in err || 'message' in err || 'status' in err)
    )
  }

  if (!isSupabaseError(error)) {
    return fallback
  }

  const code = String(error?.code || error?.error?.code || '')
  const message = String(error?.message || error?.error?.message || '')
  const status = Number(error?.status || error?.error?.status || 0)

  if (code === 'PGRST202') return '服务暂未就绪，请稍后重试'
  if (code === 'PGRST116') return '房间不存在或已被关闭'
  if (code === '42501') return '权限不足'
  if (status === 401) return '登录已失效，请刷新后重试'
  if (code === '23505') return '操作过快，请稍后重试'

  if (message) {
    if (/full/i.test(message)) return '房间已满'
    if (/playing|in_progress/i.test(message)) return '对局进行中，无法加入'
    if (/not\s*found/i.test(message)) return '房间不存在或已被关闭'
    if (/already/i.test(message)) return '你已在房间中'
    return message
  }

  return fallback
}
