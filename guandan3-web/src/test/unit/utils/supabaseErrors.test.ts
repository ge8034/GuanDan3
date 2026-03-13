import { describe, it, expect } from 'vitest'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'

describe('mapSupabaseErrorToMessage', () => {
  it('maps known codes', () => {
    expect(mapSupabaseErrorToMessage({ code: 'PGRST202' }, 'x')).toBe('服务暂未就绪，请稍后重试')
    expect(mapSupabaseErrorToMessage({ code: 'PGRST116' }, 'x')).toBe('房间不存在或已被关闭')
    expect(mapSupabaseErrorToMessage({ code: '42501' }, 'x')).toBe('权限不足')
    expect(mapSupabaseErrorToMessage({ status: 401 }, 'x')).toBe('登录已失效，请刷新后重试')
    expect(mapSupabaseErrorToMessage({ code: '23505' }, 'x')).toBe('操作过快，请稍后重试')
  })

  it('maps common message patterns', () => {
    expect(mapSupabaseErrorToMessage({ message: 'room is FULL' }, 'x')).toBe('房间已满')
    expect(mapSupabaseErrorToMessage({ message: 'game is playing' }, 'x')).toBe('对局进行中，无法加入')
    expect(mapSupabaseErrorToMessage({ message: 'not found' }, 'x')).toBe('房间不存在或已被关闭')
    expect(mapSupabaseErrorToMessage({ message: 'already joined' }, 'x')).toBe('你已在房间中')
  })

  it('falls back when no info', () => {
    expect(mapSupabaseErrorToMessage({}, '默认')).toBe('默认')
  })
})
