/**
 * Supabase Mock 工具
 * 提供完整的 Supabase 客户端 mock，支持链式调用
 */

import { vi } from 'vitest'

// 构建完整的查询链 mock
export function buildQueryChain() {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
    maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    then: vi.fn((resolve: any) => Promise.resolve(resolve({ data: [], error: null }))),
    catch: vi.fn(() => ({ data: [], error: null })),
  }
}

// 创建 mock 频道
export function createMockChannel() {
  return {
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockResolvedValue({}),
    unsubscribe: vi.fn(),
  }
}

// 创建完整的 Supabase mock
export function createSupabaseMock() {
  const mockChannel = createMockChannel()

  return {
    // 数据库查询
    from: vi.fn(() => buildQueryChain()),

    // Realtime 频道
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn().mockReturnValue('ok'),
    removeAllChannels: vi.fn(),

    // 认证
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
        error: null,
      }),
    },

    // RPC 调用 - 接受函数名和参数
    rpc: vi.fn((fnName: string, params: any) => {
      // 默认返回空数据，测试中可以覆盖
      return Promise.resolve({ data: null, error: null })
    }),

    // 获取客户端实例信息
    getSupabaseUrl: vi.fn(() => 'https://test.supabase.co'),
  }
}

// 导出默认的 Supabase mock 对象
export const supabaseMock = createSupabaseMock()
