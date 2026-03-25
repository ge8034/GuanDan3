import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, expect, vi } from 'vitest'

// ==================== 环境变量设置 ====================
// 设置 Supabase 环境变量（测试用）
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

// ==================== 浏览器 API Mock ====================

// window.matchMedia mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  take() {
    return []
  }
  unobserve() {}
} as any

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any

// requestAnimationFrame mock
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number
}

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id)
}

// document.documentElement.requestFullscreen mock
Object.defineProperty(document.documentElement, 'requestFullscreen', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

// navigator.serviceWorker mock
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({
      scope: '/',
      update: vi.fn().mockResolvedValue(undefined),
      unregister: vi.fn().mockResolvedValue(undefined),
      adding: vi.fn().mockResolvedValue(undefined),
      waiting: vi.fn().mockResolvedValue([]),
    }),
    ready: Promise.resolve(false),
    controller: null,
  },
})

// indexedDB mock
Object.defineProperty(window, 'indexedDB', {
  writable: true,
  value: {
    open: vi.fn(() => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          add: vi.fn(),
          get: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn(),
        })),
      })),
      close: vi.fn(),
    })),
    deleteDatabase: vi.fn().mockResolvedValue(undefined),
    cmp: vi.fn(),
  },
})

// navigator.mediaDevices mock
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    enumerateDevices: vi.fn().mockResolvedValue([]),
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => []),
    }),
  },
})

// MutationObserver mock
global.MutationObserver = class MutationObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
} as any

// performance.mark 和 performance.measure mock
if (!performance.mark) {
  performance.mark = vi.fn()
}
if (!performance.measure) {
  performance.measure = vi.fn()
}

// navigator.clipboard mock - 使用 configurable 使其可被重新定义
delete (navigator as any).clipboard
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  },
})

// ==================== Supabase Client Mock ====================
// 启用自动 mock（从 __mocks__ 目录加载）
vi.mock('@/lib/supabase/client')

// 清理函数
afterEach(() => {
  cleanup()
})

expect.extend({
  toHaveNoViolations(received: any) {
    const violations = received.violations || []
    const pass = violations.length === 0

    return {
      pass,
      message: () => {
        if (pass) {
          return 'Expected to have accessibility violations, but found none'
        }
        return `Expected to have no accessibility violations, but found ${violations.length}:\n${JSON.stringify(violations, null, 2)}`
      }
    }
  }
})
