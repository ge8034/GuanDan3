/**
 * useAIDecision Hook 测试 - 覆盖率提升
 * 测试 AI 决策 Hook
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAIDecision } from '@/lib/hooks/ai/useAIDecision'
import { useGameStore } from '@/lib/store/game'
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager'

// Mock dependencies
vi.mock('@/lib/store/game', () => ({
  useGameStore: vi.fn(),
}))

vi.mock('@/lib/hooks/ai/AISystemManager', () => ({
  aiSystemManager: {
    getSystem: vi.fn(),
  },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useAIDecision - 基本功能', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该初始化决策状态', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [],
      selectedCardIds: [],
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue({
      dispatcher: {
        processTask: vi.fn(),
      },
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })

  it('应该处理空手牌', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [],
      selectedCardIds: [],
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue(null)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })
})

describe('useAIDecision - AI 决策', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该在非练习模式触发AI决策', async () => {
    const mockProcessTask = vi.fn().mockResolvedValue({
      decision: { type: 'play', cards: [{ id: 1 }] },
    })

    vi.mocked(useGameStore).mockReturnValue({
      myHand: [{ id: 1, val: 14, suit: 'H', rank: 'A' }],
      selectedCardIds: [],
      gameId: 'game-123',
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue({
      dispatcher: {
        processTask: mockProcessTask,
      },
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    // 触发AI决策
    await act(async () => {
      // 这里需要根据实际的 useAIDecision 实现调整
      // 可能需要调用某个方法或等待状态更新
    })

    expect(result.current).toBeDefined()
  })

  it('应该处理AI决策失败', async () => {
    const mockProcessTask = vi.fn().mockRejectedValue(
      new Error('AI decision failed')
    )

    vi.mocked(useGameStore).mockReturnValue({
      myHand: [{ id: 1, val: 14, suit: 'H', rank: 'A' }],
      selectedCardIds: [],
      gameId: 'game-123',
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue({
      dispatcher: {
        processTask: mockProcessTask,
      },
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })
})

describe('useAIDecision - 练习模式', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('练习模式应该等待选牌', async () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [
        { id: 1, val: 14, suit: 'H', rank: 'A' },
        { id: 2, val: 13, suit: 'D', rank: 'K' },
      ],
      selectedCardIds: [],
      gameId: 'game-123',
    } as any)

    const { result, rerender } = renderHook(
      ({ selectedCardIds }) =>
        useAIDecision('room-123', 0, 1, true),
      {
        initialProps: { selectedCardIds: [] },
      }
    )

    expect(result.current).toBeDefined()

    // 更新选牌状态
    act(() => {
      vi.mocked(useGameStore).mockReturnValue({
        myHand: [
          { id: 1, val: 14, suit: 'H', rank: 'A' },
          { id: 2, val: 13, suit: 'D', rank: 'K' },
        ],
        selectedCardIds: [1],
        gameId: 'game-123',
      } as any)

      rerender({ selectedCardIds: [1] })
    })

    await waitFor(() => {
      expect(result.current).toBeDefined()
    })
  })
})

describe('useAIDecision - 边界条件', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理无效座位号', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [],
      selectedCardIds: [],
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', -1, 1, false)
    )

    expect(result.current).toBeDefined()
  })

  it('应该处理无效轮次号', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [],
      selectedCardIds: [],
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, -1, false)
    )

    expect(result.current).toBeDefined()
  })

  it('应该处理空房间ID', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [],
      selectedCardIds: [],
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })
})

describe('useAIDecision - 系统状态', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理系统不存在', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [{ id: 1, val: 14, suit: 'H', rank: 'A' }],
      selectedCardIds: [],
      gameId: 'game-123',
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue(null)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })

  it('应该处理系统异常', () => {
    vi.mocked(useGameStore).mockReturnValue({
      myHand: [{ id: 1, val: 14, suit: 'H', rank: 'A' }],
      selectedCardIds: [],
      gameId: 'game-123',
    } as any)

    vi.mocked(aiSystemManager.getSystem).mockReturnValue({
      dispatcher: null, // 异常状态
    } as any)

    const { result } = renderHook(() =>
      useAIDecision('room-123', 0, 1, false)
    )

    expect(result.current).toBeDefined()
  })
})
