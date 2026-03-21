import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/game'
import type { Card } from '@/lib/store/game'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    rpc: vi.fn()
  }
}))

describe('游戏状态同步集成测试', () => {
  let mockGameStore: ReturnType<typeof useGameStore.getState>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGameStore = useGameStore.getState()
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

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockGame,
                    error: null
                  })
                })
              })
            })
          })
        })
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      await mockGameStore.fetchGame('room-123')

      expect(mockGameStore.gameId).toBe('game-123')
      expect(mockGameStore.status).toBe('playing')
      expect(mockGameStore.turnNo).toBe(5)
      expect(mockGameStore.currentSeat).toBe(2)
      expect(mockGameStore.levelRank).toBe(3)
    })

    it('应该能够处理游戏不存在的情况', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null
                  })
                })
              })
            })
          })
        })
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      await mockGameStore.fetchGame('room-123')

      expect(mockGameStore.gameId).toBeNull()
      expect(mockGameStore.status).toBe('deal')
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

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockGame,
                    error: null
                  })
                })
              })
            })
          })
        })
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      await mockGameStore.fetchGame('room-123')

      expect(mockGameStore.status).toBe('paused')
      expect(mockGameStore.pausedBy).toBe('user-1')
      expect(mockGameStore.pausedAt).toBe('2026-03-21T01:00:00Z')
      expect(mockGameStore.pauseReason).toBe('休息一下')
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
      expect(mockSubmitTurn).toHaveBeenCalledWith({
        p_game_id: 'game-123',
        p_action_id: expect.any(String),
        p_expected_turn_no: 5,
        p_payload: { type: 'play', cards }
      })
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
      expect(mockSubmitTurn).toHaveBeenCalledWith({
        p_game_id: 'game-123',
        p_action_id: expect.any(String),
        p_expected_turn_no: 5,
        p_payload: { type: 'pass', cards: [] }
      })
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
      expect(mockGameStore.myHand).toEqual(cards)
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

      const mockFrom = vi.fn().mockReturnValue({
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

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockGameStore.submitTurn('play', cards)

      expect(result.error).toBeDefined()
      expect(result.refreshed).toBe(true)
      expect(mockGameStore.turnNo).toBe(7)
      expect(mockGameStore.currentSeat).toBe(3)
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
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const unsubscribe = mockGameStore.subscribeGame('room-123')
      unsubscribe()

      expect(mockUnsubscribe).toHaveBeenCalled()
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

      await mockGameStore.pauseGame('休息一下')

      expect(mockPauseGame).toHaveBeenCalledWith({
        p_game_id: 'game-123',
        p_reason: '休息一下'
      })
    })

    it('应该能够恢复游戏', async () => {
      const mockResumeGame = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

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

      await mockGameStore.resumeGame()

      expect(mockResumeGame).toHaveBeenCalledWith({
        p_game_id: 'game-123'
      })
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

      await mockGameStore.startGame('room-123')

      expect(mockStartGame).toHaveBeenCalledWith({
        p_room_id: 'room-123'
      })
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
      expect(mockGetAIHand).toHaveBeenCalledWith({
        p_game_id: 'game-123',
        p_seat_no: 1
      })
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

      expect(mockGameStore.gameId).toBeNull()
      expect(mockGameStore.status).toBe('deal')
      expect(mockGameStore.turnNo).toBe(0)
      expect(mockGameStore.currentSeat).toBe(0)
      expect(mockGameStore.myHand).toEqual([])
      expect(mockGameStore.rankings).toEqual([])
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

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: mockGame,
                    error: null
                  })
                })
              })
            })
          })
        })
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'start_game') {
          return mockStartGame()
        } else if (name === 'submit_turn') {
          return mockSubmitTurn()
        }
        return { data: null, error: null }
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      await mockGameStore.startGame('room-123')
      expect(mockStartGame).toHaveBeenCalled()

      await mockGameStore.fetchGame('room-123')
      expect(mockGameStore.gameId).toBe('game-123')
      expect(mockGameStore.status).toBe('playing')

      const cards: Card[] = [{ id: 1, suit: 'H', rank: '3', val: 3 }]
      useGameStore.setState({ myHand: cards })

      await mockGameStore.submitTurn('play', cards)
      expect(mockSubmitTurn).toHaveBeenCalled()
    })
  })
})
