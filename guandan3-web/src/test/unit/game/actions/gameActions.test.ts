/**
 * 游戏动作测试 - 覆盖率提升
 * 测试 gameActions.ts 中的各种动作函数
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { fetchGame, startGame, getAIHand, fetchLastTrickPlay, fetchTurnsSince } from '@/lib/store/game/actions/gameActions'

// Mock supabase 客户端
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
          in: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            order: vi.fn(() => Promise.resolve({ data: null, error: null })),
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      update: vi.fn(() => Promise.resolve({ error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
  },
}))

describe('gameActions - fetchGame', () => {
  let mockGameState: any

  beforeEach(() => {
    mockGameState = {
      gameId: null,
      status: 'deal',
      turnNo: 0,
      currentSeat: 0,
      levelRank: 2,
      counts: [27, 27, 27, 27],
      rankings: [],
      myHand: [],
      pausedBy: null,
      pausedAt: null,
      pauseReason: null,
      recentTurns: [],
      lastAction: null,
      setGame: vi.fn(),
      updateHand: vi.fn(),
      resetGame: vi.fn(),
      fetchLastTrickPlay: vi.fn(() => Promise.resolve(null)),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理没有游戏的情况', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as any)

    await fetchGame.call(mockGameState, 'room-123')

    expect(mockGameState.resetGame).toHaveBeenCalled()
  })

  it('应该处理游戏查询错误', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') })),
          in: vi.fn(() => Promise.resolve({ data: null, error: new Error('DB Error') })),
        })),
      })),
    } as any)

    await fetchGame.call(mockGameState, 'room-123')

    expect(mockGameState.setGame).not.toHaveBeenCalled()
  })

  it('应该成功获取游戏状态', async () => {
    const mockGame = {
      id: 'game-123',
      room_id: 'room-123',
      status: 'playing',
      turn_no: 5,
      current_seat: 2,
      state_public: {
        counts: [20, 25, 18, 30],
        rankings: [1, 3, 0, 2],
        levelRank: 3,
      },
      state_private: null,
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
        })),
      })),
    } as any)

    await fetchGame.call(mockGameState, 'room-123')

    expect(mockGameState.setGame).toHaveBeenCalledWith({
      gameId: 'game-123',
      status: 'playing',
      turnNo: 5,
      currentSeat: 2,
      levelRank: 3,
      counts: [20, 25, 18, 30],
      rankings: [1, 3, 0, 2],
      pausedBy: null,
      pausedAt: null,
      pauseReason: null,
    })
  })

  it('应该处理 paused 状态的游戏', async () => {
    const mockGame = {
      id: 'game-123',
      room_id: 'room-123',
      status: 'paused',
      turn_no: 10,
      current_seat: 1,
      state_public: null,
      state_private: null,
      paused_by: 'user-123',
      paused_at: '2024-01-01T12:00:00Z',
      pause_reason: 'manual',
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
        })),
      })),
    } as any)

    await fetchGame.call(mockGameState, 'room-123')

    expect(mockGameState.setGame).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'paused',
        pausedBy: 'user-123',
        pausedAt: '2024-01-01T12:00:00Z',
        pauseReason: 'manual',
      })
    )
  })

  it('应该处理 finished 状态的游戏', async () => {
    const mockGame = {
      id: 'game-123',
      room_id: 'room-123',
      status: 'finished',
      turn_no: 50,
      current_seat: 0,
      state_public: {
        counts: [0, 0, 0, 0],
        rankings: [1, 2, 3, 4],
      },
      state_private: null,
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
          in: vi.fn(() => Promise.resolve({ data: [mockGame], error: null })),
        })),
      })),
    } as any)

    await fetchGame.call(mockGameState, 'room-123')

    expect(mockGameState.setGame).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'finished',
        rankings: [1, 2, 3, 4],
      })
    )
  })
})

describe('gameActions - startGame', () => {
  let mockGameState: any

  beforeEach(() => {
    mockGameState = {
      gameId: null,
      fetchGame: vi.fn(() => Promise.resolve()),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理没有现有游戏的情况', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          in: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    } as any)

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

    await startGame.call(mockGameState, 'room-123')

    expect(mockGameState.fetchGame).toHaveBeenCalledWith('room-123')
  })

  it('应该清理现有游戏', async () => {
    const mockUpdate = vi.fn(() => Promise.resolve({ error: null }))
    mockUpdate.mockReturnValue({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [{ id: 'old-game' }], error: null })),
            })),
            in: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [{ id: 'old-game' }], error: null })),
            })),
          })),
        })),
      } as any)
      .mockReturnValueOnce({
        update: mockUpdate,
      } as any)

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null })

    await startGame.call(mockGameState, 'room-123')

    expect(supabase.from).toHaveBeenCalledWith('games')
  })

  it('应该处理启动游戏错误', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          or: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          in: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    } as any)

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('Start failed'),
    })

    await expect(startGame.call(mockGameState, 'room-123')).rejects.toThrow()
  })
})

describe('gameActions - getAIHand', () => {
  let mockGameState: any

  beforeEach(() => {
    mockGameState = {
      gameId: 'game-123',
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理空 gameId', async () => {
    mockGameState.gameId = null
    const result = await getAIHand.call(mockGameState, 0)
    expect(result).toEqual([])
  })

  it('应该处理无效座位号（负数）', async () => {
    const result = await getAIHand.call(mockGameState, -1)
    expect(result).toEqual([])
  })

  it('应该处理无效座位号（大于3）', async () => {
    const result = await getAIHand.call(mockGameState, 4)
    expect(result).toEqual([])
  })

  it('应该成功获取 AI 手牌', async () => {
    const mockCards = [
      { id: 1, val: 14, suit: 'H', rank: 'A' },
      { id: 2, val: 13, suit: 'D', rank: 'K' },
    ]

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockCards,
      error: null,
    })

    const result = await getAIHand.call(mockGameState, 1)

    expect(result).toEqual(mockCards)
  })

  it('应该在 RPC 失败时尝试 fallback', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    })

    const mockCards = [{ id: 1, val: 14, suit: 'H', rank: 'A' }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { hand: mockCards },
              error: null,
            })),
          })),
        })),
      })),
    } as any)

    const result = await getAIHand.call(mockGameState, 1)

    expect(result).toEqual(mockCards)
  })

  it('应该处理 game_hands 查询也失败的情况', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: null,
              error: new Error('DB failed'),
            })),
          })),
        })),
      })),
    } as any)

    const result = await getAIHand.call(mockGameState, 1)

    expect(result).toEqual([])
  })

  it('应该处理字符串格式的手牌数据', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    })

    const mockCards = [{ id: 1, val: 14, suit: 'H', rank: 'A' }]
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { hand: JSON.stringify(mockCards) },
              error: null,
            })),
          })),
        })),
      })),
    } as any)

    const result = await getAIHand.call(mockGameState, 1)

    expect(result).toEqual(mockCards)
  })

  it('应该处理无效的 JSON 字符串', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({
              data: { hand: 'invalid json' },
              error: null,
            })),
          })),
        })),
      })),
    } as any)

    const result = await getAIHand.call(mockGameState, 1)

    expect(result).toEqual([])
  })
})

describe('gameActions - fetchLastTrickPlay', () => {
  let mockGameState: any

  beforeEach(() => {
    mockGameState = {
      gameId: 'game-123',
      currentSeat: 2,
      recentTurns: [],
      setGame: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该处理空 gameId', async () => {
    mockGameState.gameId = null
    const result = await fetchLastTrickPlay.call(mockGameState)
    expect(result).toBeNull()
  })

  it('应该获取最后一个出牌动作', async () => {
    const mockTurns = [
      {
        turn_no: 10,
        seat_no: 1,
        payload: { type: 'play', cards: [{ id: 1, val: 14, suit: 'H', rank: 'A' }] },
      },
      {
        turn_no: 9,
        seat_no: 0,
        payload: { type: 'pass', cards: [] },
      },
    ]

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: mockTurns, error: null })),
          })),
        })),
      })),
    } as any)

    const result = await fetchLastTrickPlay.call(mockGameState)

    expect(result).not.toBeNull()
    expect(mockGameState.setGame).toHaveBeenCalled()
  })

  it('应该处理空回合数据', async () => {
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    } as any)

    const result = await fetchLastTrickPlay.call(mockGameState)

    // 空数据时应该返回 null
    expect(result).toBeNull()
  })
})

describe('gameActions - fetchTurnsSince', () => {
  let mockGameState: any

  beforeEach(() => {
    mockGameState = {
      gameId: 'game-123',
      recentTurns: [],
      setGame: vi.fn(),
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该获取指定回合后的数据', async () => {
    const mockTurns = [
      {
        turn_no: 5,
        seat_no: 0,
        payload: { type: 'play', cards: [{ id: 1, val: 14, suit: 'H', rank: 'A' }] },
      },
    ]

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockTurns,
      error: null,
    })

    const result = await fetchTurnsSince.call(mockGameState, 'game-123', 4)

    expect(result).toEqual(mockTurns)
    expect(mockGameState.setGame).toHaveBeenCalled()
  })

  it('应该处理 PGRST202 错误（空结果）', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST202' },
    })

    const result = await fetchTurnsSince.call(mockGameState, 'game-123', 4)

    expect(result).toEqual([])
  })

  it('应该处理其他 RPC 错误', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: new Error('RPC failed'),
    })

    await expect(fetchTurnsSince.call(mockGameState, 'game-123', 4)).rejects.toThrow()
  })

  it('应该在 gameId 不匹配时不更新状态', async () => {
    mockGameState.gameId = 'different-game'

    const mockTurns = [{ turn_no: 5, seat_no: 0, payload: { type: 'play', cards: [] } }]

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: mockTurns,
      error: null,
    })

    await fetchTurnsSince.call(mockGameState, 'game-123', 4)

    expect(mockGameState.setGame).not.toHaveBeenCalled()
  })
})
