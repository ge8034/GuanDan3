/**
 * Supabase 测试辅助函数
 * 提供可重用的 mock 构建函数，简化测试代码
 */

import { vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'

// 允许的 Supabase 查询方法白名单，用于安全检查
const ALLOWED_QUERY_METHODS = new Set([
  'select', 'insert', 'update', 'delete',
  'eq', 'neq', 'in', 'not', 'or', 'and',
  'gt', 'gte', 'lt', 'lte',
  'like', 'ilike', 'is', 'filter',
  'order', 'limit', 'range',
  'single', 'maybeSingle',
  'then', 'catch', 'finally'
])

/**
 * 创建链式查询 mock
 * @param returnValue - single/maybeSingle 返回的值
 * @returns 链式调用 mock 对象
 */
export function createQueryMock<T = { data: unknown; error: unknown }>(returnValue: T) {
  const chain: Record<string, unknown> = {
    single: vi.fn(() => Promise.resolve(returnValue)),
    maybeSingle: vi.fn(() => Promise.resolve(returnValue)),
  }

  // 所有链式查询方法
  const methods = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'not', 'or', 'and',
    'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is',
    'order', 'limit', 'range',
    'filter', 'textSearch'
  ]

  methods.forEach(method => {
    chain[method] = vi.fn(() => chain)
  })

  return chain
}

/**
 * 创建返回数组的查询 mock (用于非 single 查询)
 * @param returnValue - 返回的数组数据
 * @param terminalMethods - 可选：作为终结点的方法名数组（这些方法返回 promise）
 */
export function createArrayQueryMock<T = any[]>(
  returnValue: { data: T; error: any },
  terminalMethods: string[] = []
) {
  const chain: any = {}

  const methods = [
    'select', 'insert', 'update', 'delete',
    'eq', 'neq', 'in', 'not', 'or', 'and',
    'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is',
    'order', 'limit', 'range',
    'filter', 'textSearch'
  ]

  methods.forEach(method => {
    // 如果是终结方法，返回 promise
    if (terminalMethods.includes(method)) {
      chain[method] = vi.fn(() => Promise.resolve(returnValue))
    } else {
      chain[method] = vi.fn(() => chain)
    }
  })

  return chain
}

/**
 * 设置 supabase.from mock
 * @param table - 表名
 * @param mockChain - mock 链对象
 */
export function mockSupabaseFrom(table: string, mockChain: any) {
  vi.mocked(supabase.from).mockImplementation((t: string) => {
    if (t === table) return mockChain
    return createQueryMock({ data: null, error: null })
  })
}

/**
 * 重置 supabase.from mock 到默认行为
 */
export function resetSupabaseFromMock() {
  vi.mocked(supabase.from).mockImplementation(() => createQueryMock({ data: null, error: null }))
}

/**
 * 创建深度嵌套的 Supabase 查询 mock
 * 用于需要 .select().eq().in().order() 等多层级联调用
 * @param finalValue - 最终返回值 (由 single/maybeSingle 返回)
 * @param defaultValue - 直接 await 链时的默认返回值（用于 .in() 等非终结方法的 await）
 */
export function createNestedQueryMock<T = { data: unknown; error: unknown }>(
  finalValue: T,
  defaultValue?: T
) {
  const value = defaultValue ?? finalValue

  // 创建基础对象（将被代理）
  const base: any = {}

  // 创建 Proxy 来拦截所有属性访问
  const handler: ProxyHandler<any> = {
    get(target, prop) {
      const propStr = String(prop)

      // Promise thenable 支持
      if (prop === 'then') {
        return (onFulfilled: any, onRejected: any) =>
          Promise.resolve(value).then(onFulfilled, onRejected)
      }
      if (prop === 'catch') {
        return (onRejected: any) => Promise.resolve(value).catch(onRejected)
      }
      if (prop === 'finally') {
        return (onFinally: any) => Promise.resolve(value).finally(onFinally)
      }

      // 终结方法返回 Promise
      if (prop === 'single' || prop === 'maybeSingle') {
        return () => Promise.resolve(finalValue)
      }

      // 所有其他方法 - 安全检查：只允许已知的查询方法
      // 在开发模式下警告未知方法访问
      if (process.env.NODE_ENV === 'development' && !ALLOWED_QUERY_METHODS.has(propStr)) {
        // 允许 Symbol 和内部属性
        if (typeof prop !== 'symbol' && !propStr.startsWith('_')) {
          console.warn(`[Mock] Unexpected property access on query chain: ${propStr}`)
        }
      }

      // 返回函数，调用时返回 proxy 本身以支持链式调用
      return vi.fn(() => proxy)
    }
  }

  // 创建代理对象，代理 base
  const proxy = new Proxy(base, handler)

  return proxy
}
