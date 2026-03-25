/**
 * Supabase Client Mock
 * 由 vitest 自动加载（位于 __mocks__ 目录）
 */

import { vi } from 'vitest'

// 构建查询链 - 每次调用返回新的链式对象
const buildQueryChain = () => {
  const chain: any = {}

  // 定义所有链式方法 - 必须先定义 chain 对象再定义方法
  const chainMethods = ['select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'not', 'or', 'and',
    'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'filter',
    'order', 'limit', 'range']

  // 先设置 single 和 maybeSingle
  chain.single = vi.fn(() => Promise.resolve({ data: null, error: null }))
  chain.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }))

  // 然后设置链式方法
  chainMethods.forEach(method => {
    const mock = vi.fn()
    mock.mockImplementation(() => chain)
    chain[method] = mock
  })

  return chain
}

// from 每次调用都返回新的 queryChain
// 导出 supabase mock
export const supabase = {
  from: vi.fn(() => buildQueryChain()),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({} as any)),
    off: vi.fn(() => ({} as any)),
    subscribe: vi.fn(() => Promise.resolve({})),
    unsubscribe: vi.fn(),
  })),
  removeChannel: vi.fn(() => 'ok'),
  removeAllChannels: vi.fn(),
  auth: {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-id' } },
      error: null,
    })),
    getSession: vi.fn(() => Promise.resolve({
      data: { session: { access_token: 'test-token' } },
      error: null,
    })),
  },
  rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  getSupabaseUrl: vi.fn(() => 'https://test.supabase.co'),
}

export default { supabase }
