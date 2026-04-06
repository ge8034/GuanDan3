/**
 * useAISystem Hook 测试 - 覆盖率提升
 * 测试 AI 系统初始化 Hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAISystem } from '@/lib/hooks/ai/useAISystem'
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager'
import { logger } from '@/lib/utils/logger'

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
  },
}))

describe('useAISystem - 基本功能', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('房主应该创建系统', () => {
    const { result } = renderHook(() =>
      useAISystem('room-123', 'medium', true)
    )

    expect(result.current.system).toBeDefined()
    expect(result.current.system?.roomId).toBe('room-123')
    expect(result.current.system?.difficulty).toBe('medium')
  })

  it('非房主不应该创建系统', () => {
    const { result } = renderHook(() =>
      useAISystem('room-123', 'medium', false)
    )

    expect(result.current.system).toBeNull()
  })

  it('应该返回已存在的系统', () => {
    // 先创建一个系统
    aiSystemManager.getOrCreateSystem('room-123', 'easy')

    const { result } = renderHook(() =>
      useAISystem('room-123', 'easy', true)
    )

    expect(result.current.system).toBeDefined()
    expect(result.current.system?.difficulty).toBe('easy')
  })

  it('空房间ID不应该创建系统', () => {
    const { result } = renderHook(() =>
      useAISystem('', 'medium', true)
    )

    expect(result.current.system).toBeNull()
  })
})

describe('useAISystem - 难度更新', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该在难度改变时更新系统', () => {
    const { result, rerender } = renderHook(
      ({ difficulty }) => useAISystem('room-123', difficulty, true),
      { initialProps: { difficulty: 'easy' as const } }
    )

    expect(result.current.system?.difficulty).toBe('easy')

    rerender({ difficulty: 'hard' })

    expect(result.current.system?.difficulty).toBe('hard')
  })

  it('非房主不应该更新系统', () => {
    const { result, rerender } = renderHook(
      ({ isOwner }) => useAISystem('room-123', 'medium', isOwner),
      { initialProps: { isOwner: true } }
    )

    expect(result.current.system).toBeDefined()

    rerender({ isOwner: false })

    // 系统应该仍然存在（不会删除），只是不会创建新系统
    expect(result.current.system).toBeDefined()
  })
})

describe('useAISystem - 依赖更新', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该在房间ID改变时切换系统', () => {
    const { result, rerender } = renderHook(
      ({ roomId }) => useAISystem(roomId, 'medium', true),
      { initialProps: { roomId: 'room-1' } }
    )

    expect(result.current.system?.roomId).toBe('room-1')

    act(() => {
      rerender({ roomId: 'room-2' })
    })

    expect(result.current.system?.roomId).toBe('room-2')
  })

  it('应该在房主状态改变时更新', () => {
    const { result, rerender } = renderHook(
      ({ isOwner }) => useAISystem('room-123', 'medium', isOwner),
      { initialProps: { isOwner: false } }
    )

    expect(result.current.system).toBeNull()

    act(() => {
      rerender({ isOwner: true })
    })

    expect(result.current.system).toBeDefined()
  })
})

describe('useAISystem - 调试日志', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该在开发模式记录调试信息', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    renderHook(() => useAISystem('room-123', 'medium', true))

    expect(logger.debug).toHaveBeenCalled()

    process.env.NODE_ENV = originalEnv
  })

  it('非房主应该记录跳过信息', () => {
    renderHook(() => useAISystem('room-123', 'medium', false))

    expect(logger.debug).toHaveBeenCalledWith(
      '[useAISystem] 跳过：不是房主'
    )
  })
})

describe('useAISystem - 边界条件', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该处理 undefined 房间ID', () => {
    const { result } = renderHook(() =>
      useAISystem(undefined as any, 'medium', true)
    )

    expect(result.current.system).toBeNull()
  })

  it('应该处理 null 房间ID', () => {
    const { result } = renderHook(() =>
      useAISystem(null as any, 'medium', true)
    )

    expect(result.current.system).toBeNull()
  })

  it('应该处理所有难度级别', () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

    difficulties.forEach((difficulty) => {
      const { result } = renderHook(() =>
        useAISystem(`room-${difficulty}`, difficulty, true)
      )

      expect(result.current.system?.difficulty).toBe(difficulty)
    })
  })
})

describe('useAISystem - 系统状态管理', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该显示活跃房间', () => {
    renderHook(() => useAISystem('room-123', 'medium', true))

    const activeRooms = aiSystemManager.getActiveRoomIds()
    expect(activeRooms).toContain('room-123')
  })

  it('应该允许外部访问系统', () => {
    renderHook(() => useAISystem('room-123', 'hard', true))

    const system = aiSystemManager.getSystem('room-123')
    expect(system).toBeDefined()
    expect(system?.difficulty).toBe('hard')
  })
})
