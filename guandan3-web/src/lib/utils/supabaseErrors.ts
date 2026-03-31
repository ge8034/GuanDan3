import type { SupabaseError } from '@/types/supabase'

/**
 * 将 Supabase 错误映射为用户友好的错误消息
 *
 * 将 Supabase API 返回的技术错误码和消息转换为用户可理解的中文提示。
 * 支持常见错误码的映射和消息内容的模式匹配。
 *
 * @param error - 错误对象，可以是 SupabaseError 或其他未知类型
 * @param fallback - 当无法识别错误时使用的默认消息
 * @returns 用户友好的中文错误消息
 *
 * @example
 * ```ts
 * // 处理房间不存在错误
 * const { error } = await supabase.from('rooms').select().eq('id', roomId).single()
 * if (error) {
 *   showToast({
 *     message: mapSupabaseErrorToMessage(error, '加载房间失败'),
 *     kind: 'error'
 *   })
 * }
 * ```
 *
 * @example
 * ```ts
 * // 处理权限错误
 * mapSupabaseErrorToMessage(
 *   { code: '42501', message: 'Permission denied' },
 *   '操作失败'
 * )
 * // 返回 '权限不足'
 * ```
 *
 * @remarks
 * 支持的错误码映射：
 * - `PGRST202` - 服务暂未就绪
 * - `PGRST116` - 房间不存在或已被关闭
 * - `42501` - 权限不足
 * - `401` - 登录已失效
 * - `23505` - 操作过快（唯一约束冲突）
 */
export const mapSupabaseErrorToMessage = (error: unknown, fallback: string): string => {
  // 类型守卫：检查是否为 SupabaseError
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

  // 错误码映射
  if (code === 'PGRST202') return '服务暂未就绪，请稍后重试'
  if (code === 'PGRST116') return '房间不存在或已被关闭'
  if (code === '42501') return '权限不足'
  if (status === 401) return '登录已失效，请刷新后重试'
  if (code === '23505') return '操作过快，请稍后重试'

  // 消息内容模式匹配
  if (message) {
    if (/full/i.test(message)) return '房间已满'
    if (/playing|in_progress/i.test(message)) return '对局进行中，无法加入'
    if (/not\s*found/i.test(message)) return '房间不存在或已被关闭'
    if (/already/i.test(message)) return '你已在房间中'
    return message
  }

  return fallback
}
