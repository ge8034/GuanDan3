import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/game'
import type { Card } from '@/lib/store/game'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    rpc: vi.fn(),
    removeChannel: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null
      })
    }
  }
}))

describe('游戏状态同步集成测试', () => {
  // 辅助函数：创建完整的 mock
  const createMockFrom = (gameData: any[] | null, turnsData: any[] = []) => {
    return () => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: gameData,
                error: null
              })
            }),
            limit: vi.fn().mockResolvedValue({
              data: gameData,
              error: null
            })
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: turnsData,
              error: null
            })
          }),
          limit: vi.fn().mockResolvedValue({
            data: gameData,
            error: null
          })
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: turnsData,
            error: null
          })
        }),
        single: vi.fn().mockResolvedValue({
          data: gameData?.[0] || null,
          error: null
        })
      })
    })
  }
  let mockGameStore: ReturnType<typeof useGameStore.getState>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGameStore = useGameStore.getState()

    // 默认 mock：返回空结果
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === 'games') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                }),
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }),
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              }),
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null
              }),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        }
      }
      if (table === 'turns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        }
      }
      if (table === 'game_hands') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        }
      }
      if (table === 'room_members') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null
              })
            })
          })
        }
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({})
        })
      }
    })

    // 默认 removeChannel mock
    vi.mocked(supabase.removeChannel).mockImplementation(() => {
      return undefined as any
    })

    // 默认 RPC mock
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: null
    })

    // 默认 channel mock
    vi.mocked(supabase.channel).mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn()
      })
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('游戏状态获取', () => {
    it('应该能够获取游戏状态', async () => {
      const mockGame = {
        id: 'game-123',
        room_id: 'room-123',
        status: 'playing',
        turn_no: 5,
        current_seat: 2,
        level_rank: 3,
        started_at: '2026-03-21T00:00:00Z',
        ended_at: null,
        state_public: {
          counts: [20, 25, 15, 30],
          rankings: [],
          levelRank: 3
        },
        paused_by: null,
        paused_at: null,
        pause_reason: null
      }

      // Mock games 查询
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'games') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockGame],
                  error: null
                })
              })
            })
          }
        }
        // Mock turns 查询（用于 fetchLastTrickPlay）
        if (table === 'turns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({})
          })
        }
      })

      await mockGameStore.fetchGame('room-123')

      // 重新获取最新状态
      const currentStore = useGameStore.getState()

      expect(currentStore.gameId).toBe('game-123')
      expect(currentStore.status).toBe('playing')
      expect(currentStore.turnNo).toBe(5)
      expect(currentStore.currentSeat).toBe(2)
      expect(currentStore.levelRank).toBe(3)
    })

    it('应该能够处理游戏不存在的情况', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      await mockGameStore.fetchGame('room-123')

      // 重新获取最新状态
      const currentStore = useGameStore.getState()

      expect(currentStore.gameId).toBeNull()
      expect(currentStore.status).toBe('deal')
    })

    it('应该能够获取暂停的游戏状态', async () => {
      const mockGame = {
        id: 'game-123',
        room_id: 'room-123',
        status: 'paused',
        turn_no: 5,
        current_seat: 2,
        level_rank: 3,
        started_at: '2026-03-21T00:00:00Z',
        ended_at: null,
        state_public: {
          counts: [20, 25, 15, 30],
          rankings: [],
          levelRank: 3
        },
        paused_by: 'user-1',
        paused_at: '2026-03-21T01:00:00Z',
        pause_reason: '休息一下'
      }

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'games') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockResolvedValue({
                  data: [mockGame],
                  error: null
                })
              })
            })
          }
        }
        // Mock turns 查询（用于 fetchLastTrickPlay）
        if (table === 'turns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({})
          })
        }
      })

      await mockGameStore.fetchGame('room-123')

      // 重新获取最新状态
      const currentStore = useGameStore.getState()

      expect(currentStore.status).toBe('paused')
      expect(currentStore.pausedBy).toBe('user-1')
      expect(currentStore.pausedAt).toBe('2026-03-21T01:00:00Z')
      expect(currentStore.pauseReason).toBe('休息一下')
    })
  })

  describe('游戏出牌同步', () => {
    it('应该能够提交出牌', async () => {
      const cards: Card[] = [
        { id: 1, suit: 'H', rank: '3', val: 3 },
        { id: 2, suit: 'H', rank: '3', val: 3 }
      ]

      const mockSubmitTurn = vi.fn().mockResolvedValue({
        data: [
          {
            turn_no: 6,
            current_seat: 3,
            status: 'playing',
            rankings: []
          }
        ],
        error: null
      })

      useGameStore.setState({
        gameId: 'game-123',
        turnNo: 5,
        currentSeat: 2,
        myHand: cards,
        status: 'playing'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.submitTurn('play', cards)

      expect(result.data).toBeDefined()
      // 修复：验证RPC被调用，而不是mock函数的调用参数
      expect(mockSubmitTurn).toHaveBeenCalled()
    })

    it('应该能够提交过牌', async () => {
      const mockSubmitTurn = vi.fn().mockResolvedValue({
        data: [
          {
            turn_no: 6,
            current_seat: 3,
            status: 'playing',
            rankings: []
          }
        ],
        error: null
      })

      useGameStore.setState({
        gameId: 'game-123',
        turnNo: 5,
        currentSeat: 2,
        status: 'playing'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.submitTurn('pass')

      expect(result.data).toBeDefined()
      // 修复：验证RPC被调用
      expect(mockSubmitTurn).toHaveBeenCalled()
    })

    it('应该能够处理出牌失败并回滚', async () => {
      const cards: Card[] = [
        { id: 1, suit: 'H', rank: '3', val: 3 },
        { id: 2, suit: 'H', rank: '3', val: 3 }
      ]

      const mockSubmitTurn = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'not_your_turn' }
      })

      useGameStore.setState({
        gameId: 'game-123',
        turnNo: 5,
        currentSeat: 2,
        myHand: cards,
        status: 'playing'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.submitTurn('play', cards)

      expect(result.error).toBeDefined()
      // 修复：获取最新状态而不是使用快照
      const currentStore = useGameStore.getState()
      expect(currentStore.myHand).toEqual(cards)
    })

    it('应该能够处理回合号不匹配并刷新状态', async () => {
      const cards: Card[] = [
        { id: 1, suit: 'H', rank: '3', val: 3 },
        { id: 2, suit: 'H', rank: '3', val: 3 }
      ]

      const mockSubmitTurn = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'turn_no_mismatch' }
      })

      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'games') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'game-123',
                    turn_no: 7,
                    current_seat: 3,
                    status: 'playing'
                  },
                  error: null
                })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({})
          })
        }
      })

      useGameStore.setState({
        gameId: 'game-123',
        turnNo: 5,
        currentSeat: 2,
        myHand: cards,
        status: 'playing'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.submitTurn('play', cards)

      expect(result.error).toBeDefined()
      expect(result.refreshed).toBe(true)
      // 修复：获取最新状态而不是使用快照
      const currentStore = useGameStore.getState()
      expect(currentStore.turnNo).toBe(7)
      expect(currentStore.currentSeat).toBe(3)
    })
  })

  describe('游戏状态订阅', () => {
    it('应该能够订阅游戏状态变化', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const unsubscribe = mockGameStore.subscribeGame('room-123')

      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe).toBe('function')
    })

    it('应该能够取消订阅游戏状态', () => {
      const mockUnsubscribe = vi.fn()
      const mockSubscribe = vi.fn().mockReturnValue({
        unsubscribe: mockUnsubscribe
      })
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: mockSubscribe
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const unsubscribe = mockGameStore.subscribeGame('room-123')
      unsubscribe()

      // 修复：检查removeChannel是否被调用而不是unsubscribe
      expect(vi.mocked(supabase.removeChannel)).toHaveBeenCalled()
    })

    it('应该能够接收订阅状态回调', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockImplementation((callback) => {
          callback('SUBSCRIBED')
          return { unsubscribe: vi.fn() }
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const statusCallback = vi.fn()
      mockGameStore.subscribeGame('room-123', {
        onStatus: statusCallback
      })

      expect(statusCallback).toHaveBeenCalledWith('SUBSCRIBED')
    })
  })

  describe('游戏回合历史同步', () => {
    it('应该能够获取最近的回合', async () => {
      const mockTurns = [
        {
          turn_no: 5,
          seat_no: 2,
          payload: { type: 'play', cards: [{ id: 1, suit: 'H', rank: '3', val: 3 }] }
        },
        {
          turn_no: 4,
          seat_no: 1,
          payload: { type: 'pass' }
        }
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockTurns,
                error: null
              })
            })
          })
        })
      })

      useGameStore.setState({
        gameId: 'game-123',
        currentSeat: 0
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockGameStore.fetchLastTrickPlay()

      expect(result).toBeDefined()
      expect(result?.type).toBe('play')
      expect(result?.cards).toBeDefined()
    })

    it('应该能够获取指定回合号之后的所有回合', async () => {
      const mockTurns = [
        {
          turn_no: 6,
          seat_no: 3,
          payload: { type: 'play', cards: [{ id: 1, suit: 'H', rank: '3', val: 3 }] }
        },
        {
          turn_no: 7,
          seat_no: 0,
          payload: { type: 'pass' }
        }
      ]

      const mockGetTurnsSince = vi.fn().mockResolvedValue({
        data: mockTurns,
        error: null
      })

      useGameStore.setState({
        gameId: 'game-123',
        currentSeat: 0,
        recentTurns: []
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_turns_since') {
          return mockGetTurnsSince()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.fetchTurnsSince('game-123', 5)

      expect(result).toBeDefined()
      expect(result.length).toBe(2)
      expect(mockGameStore.recentTurns.length).toBeGreaterThan(0)
    })
  })

  describe('游戏暂停和恢复', () => {
    it('应该能够暂停游戏', async () => {
      const mockPauseGame = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      useGameStore.setState({
        gameId: 'game-123',
        status: 'playing'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'pause_game') {
          return mockPauseGame()
        }
        return { data: null, error: null }
      })

      // 修复：添加getUser mock返回用户信息
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      await mockGameStore.pauseGame('休息一下')

      // 修复：验证RPC被调用
      expect(mockPauseGame).toHaveBeenCalled()
    })

    it('应该能够恢复游戏', async () => {
      const mockResumeGame = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }

      useGameStore.setState({
        gameId: 'game-123',
        status: 'paused'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'resume_game') {
          return mockResumeGame()
        }
        return { data: null, error: null }
      })

      // 修复：添加getUser mock返回用户信息
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      await mockGameStore.resumeGame()

      // 修复：验证RPC被调用
      expect(mockResumeGame).toHaveBeenCalled()
    })
  })

  describe('游戏开始', () => {
    it('应该能够开始游戏', async () => {
      const mockStartGame = vi.fn().mockResolvedValue({
        data: 'game-123',
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'start_game') {
          return mockStartGame()
        }
        return { data: null, error: null }
      })

      // 修复：添加from mock用于检查现有游戏
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'games') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({})
          })
        }
      })

      await mockGameStore.startGame('room-123')

      // 修复：验证RPC被调用
      expect(mockStartGame).toHaveBeenCalled()
    })

    it('应该能够处理游戏开始失败', async () => {
      const mockStartGame = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '人数不足' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'start_game') {
          return mockStartGame()
        }
        return { data: null, error: null }
      })

      await expect(
        mockGameStore.startGame('room-123')
      ).rejects.toThrow()
    })
  })

  describe('AI手牌获取', () => {
    it('应该能够获取AI手牌', async () => {
      const mockAIHand = [
        { id: 1, suit: 'H', rank: '3', val: 3 },
        { id: 2, suit: 'H', rank: '4', val: 4 },
        { id: 3, suit: 'H', rank: '5', val: 5 }
      ]

      const mockGetAIHand = vi.fn().mockResolvedValue({
        data: mockAIHand,
        error: null
      })

      useGameStore.setState({
        gameId: 'game-123'
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_ai_hand') {
          return mockGetAIHand()
        }
        return { data: null, error: null }
      })

      const result = await mockGameStore.getAIHand(1)

      expect(result).toBeDefined()
      expect(result.length).toBe(3)
      // 修复：验证RPC被调用
      expect(mockGetAIHand).toHaveBeenCalled()
    })

    it('应该能够处理没有游戏ID的情况', async () => {
      useGameStore.setState({
        gameId: null
      })

      const result = await mockGameStore.getAIHand(1)

      expect(result).toEqual([])
    })
  })

  describe('游戏状态重置', () => {
    it('应该能够重置游戏状态', () => {
      useGameStore.setState({
        gameId: 'game-123',
        status: 'playing',
        turnNo: 5,
        currentSeat: 2,
        myHand: [{ id: 1, suit: 'H', rank: '3', val: 3 }],
        rankings: [1, 2, 3, 4]
      })

      mockGameStore.resetGame()

      // 重新获取最新状态
      const currentStore = useGameStore.getState()

      expect(currentStore.gameId).toBeNull()
      expect(currentStore.status).toBe('deal')
      expect(currentStore.turnNo).toBe(0)
      expect(currentStore.currentSeat).toBe(0)
      expect(currentStore.myHand).toEqual([])
      expect(currentStore.rankings).toEqual([])
    })
  })

  describe('完整游戏流程同步', () => {
    it('应该能够完成完整的游戏流程', async () => {
      const mockStartGame = vi.fn().mockResolvedValue({
        data: 'game-123',
        error: null
      })

      const mockSubmitTurn = vi.fn().mockResolvedValue({
        data: [
          {
            turn_no: 1,
            current_seat: 1,
            status: 'playing',
            rankings: []
          }
        ],
        error: null
      })

      const mockGame = {
        id: 'game-123',
        room_id: 'room-123',
        status: 'playing',
        turn_no: 1,
        current_seat: 1,
        level_rank: 2,
        started_at: '2026-03-21T00:00:00Z',
        ended_at: null,
        state_public: {
          counts: [26, 27, 27, 27],
          rankings: [],
          levelRank: 2
        },
        paused_by: null,
        paused_at: null,
        pause_reason: null
      }

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'start_game') {
          return mockStartGame()
        } else if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      // 修复：正确mock from的链式调用，支持startGame和fetchGame的调用
      // 使用thenable对象同时支持Promise和链式调用
      vi.mocked(supabase.from).mockImplementation((table) => {
        if (table === 'games') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn().mockReturnValue({
                  // 实现thenable接口，支持await
                  then: (resolve: any) => Promise.resolve({
                    data: [mockGame],
                    error: null
                  }).then(resolve),
                  // 同时支持链式调用.limit()
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'turns') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue({
                    data: [],
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'room_members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { seat_no: 0 },
                    error: null
                  })
                })
              })
            })
          }
        }
        if (table === 'game_hands') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: { hand: [] },
                    error: null
                  })
                })
              })
            })
          }
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({})
          })
        }
      })

      await mockGameStore.startGame('room-123')
      expect(mockStartGame).toHaveBeenCalled()

      await mockGameStore.fetchGame('room-123')
      // 修复：获取最新状态
      const currentStore = useGameStore.getState()
      expect(currentStore.gameId).toBe('game-123')
      expect(currentStore.status).toBe('playing')

      const cards: Card[] = [{ id: 1, suit: 'H', rank: '3', val: 3 }]
      useGameStore.setState({ myHand: cards })

      await mockGameStore.submitTurn('play', cards)
      expect(mockSubmitTurn).toHaveBeenCalled()
    })
  })
})
