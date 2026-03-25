import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { useGameStore, type Card } from '@/lib/store/game'
import { withNodeEnv } from '@/test/utils/withNodeEnv'

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...overrides,
})

const originalFetchTurnsSince = useGameStore.getState().fetchTurnsSince
const originalFetchLastTrickPlay = useGameStore.getState().fetchLastTrickPlay

describe('useGameStore基本操作', () => {
  it('setGame会合并更新状态', () => {
    useGameStore.setState({ status: 'deal', turnNo: 0 })
    useGameStore.getState().setGame({ status: 'playing', turnNo: 3 } as any)
    expect(useGameStore.getState().status).toBe('playing')
    expect(useGameStore.getState().turnNo).toBe(3)
  })

  it('updateHand会更新手牌', () => {
    useGameStore.getState().updateHand([makeCard({ id: 1 }), makeCard({ id: 2 })])
    expect(useGameStore.getState().myHand.map(c => c.id)).toEqual([1, 2])
  })

  it('playTurn会转发到submitTurn', async () => {
    const originalSubmitTurn = useGameStore.getState().submitTurn
    const submitTurn = vi.fn().mockResolvedValue({ data: [] })
    useGameStore.setState({ submitTurn: submitTurn as any })
    await useGameStore.getState().playTurn([makeCard({ id: 1 })])
    expect(submitTurn).toHaveBeenCalled()
    useGameStore.setState({ submitTurn: originalSubmitTurn as any })
  })
})

describe('useGameStore.submitTurn', () => {
  beforeEach(() => {
    ;(supabase.rpc as any).mockReset()
    ;(supabase.from as any).mockReset()

    useGameStore.setState({
      gameId: null,
      status: 'deal',
      turnNo: 0,
      currentSeat: 0,
      myHand: [],
      lastAction: null,
      scores: {},
      counts: [27, 27, 27, 27],
      rankings: [],
    })

    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
      vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000')
    } else if (globalThis.crypto) {
      Object.defineProperty(globalThis.crypto, 'randomUUID', {
        value: () => '00000000-0000-0000-0000-000000000000',
        configurable: true,
      })
    }
  })

  it('提交成功后更新turnNo/currentSeat/status/rankings，并执行乐观移除', async () => {
    const cardA = makeCard({ id: 10, suit: 'H', rank: '2', val: 2 })
    const cardB = makeCard({ id: 11, suit: 'S', rank: 'A', val: 14 })

    useGameStore.setState({
      gameId: 'game-1',
      status: 'playing',
      turnNo: 0,
      currentSeat: 0,
      myHand: [cardA, cardB],
      rankings: [],
    })

    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 1, current_seat: 1, status: 'playing', rankings: [0] }],
      error: null,
    })

    const res = await useGameStore.getState().submitTurn('play', [cardA])

    expect(res).toEqual({ data: [{ turn_no: 1, current_seat: 1, status: 'playing', rankings: [0] }] })
    expect(useGameStore.getState().myHand).toEqual([cardB])
    expect(useGameStore.getState().turnNo).toBe(1)
    expect(useGameStore.getState().currentSeat).toBe(1)
    expect(useGameStore.getState().status).toBe('playing')
    expect(useGameStore.getState().rankings).toEqual([0])
  })

  it('turn_no_mismatch时会刷新games表并返回refreshed结果', async () => {
    useGameStore.setState({
      gameId: 'game-2',
      status: 'playing',
      turnNo: 1,
      currentSeat: 0,
      myHand: [makeCard({ id: 12, suit: 'D', rank: '3', val: 3 })],
    })

    ;(supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'turn_no_mismatch: Expected 2, Got 1' },
    })

    const fromGames = (supabase.from as any).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'game-2', turn_no: 2, current_seat: 1, status: 'playing' },
      }),
    })

    const res = await useGameStore.getState().submitTurn('pass', [])

    expect(fromGames).toBeDefined()
    expect((res as any).refreshed).toBe(true)
    expect(useGameStore.getState().turnNo).toBe(2)
    expect(useGameStore.getState().currentSeat).toBe(1)
    expect(useGameStore.getState().status).toBe('playing')
  })

  it('提交失败会回滚乐观更新', async () => {
    const cardA = makeCard({ id: 10, suit: 'H', rank: '2', val: 2 })
    const cardB = makeCard({ id: 11, suit: 'S', rank: 'A', val: 14 })

    useGameStore.setState({
      gameId: 'game-3',
      status: 'playing',
      turnNo: 0,
      currentSeat: 0,
      myHand: [cardA, cardB],
    })

    ;(supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'not_your_turn: You are Seat 1, Current is Seat 0' },
    })

    const res = await useGameStore.getState().submitTurn('play', [cardA])

    expect(res.error).toBeDefined()
    expect(useGameStore.getState().myHand).toEqual([cardA, cardB])
  })

  it('生产环境下未知错误会记录简要错误日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withNodeEnv('production', async () => {
      useGameStore.setState({
        gameId: 'game-4',
        status: 'playing',
        turnNo: 0,
        currentSeat: 0,
        myHand: [],
      })
      ;(supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { code: 'X', message: 'fail' },
      })

      await useGameStore.getState().submitTurn('pass', [])
      expect(errSpy).toHaveBeenCalled()
      expect((errSpy as any).mock.calls.some((c: any[]) => String(c[0]).includes('Submit turn failed:'))).toBe(true)
      expect((errSpy as any).mock.calls.some((c: any[]) => String(c[0]).includes('Submit turn failed detailed:'))).toBe(false)
    })
    errSpy.mockRestore()
  })

  it('生产环境下not_your_turn不会记录错误日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withNodeEnv('production', async () => {
      useGameStore.setState({
        gameId: 'game-5',
        status: 'playing',
        turnNo: 0,
        currentSeat: 0,
        myHand: [],
      })
      ;(supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { code: 'P0001', message: 'not_your_turn: You are Seat 1, Current is Seat 0' },
      })

      await useGameStore.getState().submitTurn('pass', [])
      expect(errSpy).not.toHaveBeenCalled()
    })
    errSpy.mockRestore()
  })

  it('开发环境下未知错误会记录详细错误日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withNodeEnv('development', async () => {
      useGameStore.setState({
        gameId: 'game-6',
        status: 'playing',
        turnNo: 0,
        currentSeat: 0,
        myHand: [],
      })
      ;(supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { code: 'X', message: 'fail' },
      })

      await useGameStore.getState().submitTurn('pass', [])
      expect(errSpy).toHaveBeenCalled()
      expect((errSpy as any).mock.calls.some((c: any[]) => String(c[0]).includes('Submit turn failed detailed:'))).toBe(true)
    })
    errSpy.mockRestore()
  })
})

describe('useGameStore.fetchGame', () => {
  beforeEach(() => {
    ;(supabase.from as any).mockReset()
    useGameStore.setState({
      gameId: null,
      status: 'deal',
      turnNo: 0,
      currentSeat: 0,
      myHand: [],
      lastAction: null,
      scores: {},
      counts: [27, 27, 27, 27],
      rankings: [],
    })
  })

  it('拉取finished对局并同步counts/rankings与排序后的手牌', async () => {
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'g-finished',
            status: 'finished',
            turn_no: 9,
            current_seat: 2,
            state_public: { counts: [0, 1, 2, 3], rankings: [0, 1, 2, 3] },
            state_private: {
              hands: {
                '0': [  // 座位0的手牌
                  makeCard({ id: 1, suit: 'H', rank: '2', val: 2 }),
                  makeCard({ id: 2, suit: 'S', rank: 'A', val: 14 }),
                  makeCard({ id: 3, suit: 'D', rank: 'K', val: 13 }),
                ]
              }
            },
          },
        ],
        error: null,
      }),
    }

    // room_members 查询（返回 null，会使用 state_private 的 fallback）
    const memberQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    }

    // turns 查询（fetchLastTrickPlay）
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    // 注意：由于 state_private 有手牌数据，game_hands 查询不会被执行
    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)      // games
      .mockImplementationOnce(() => memberQuery)    // room_members
      .mockImplementationOnce(() => turnsQuery)     // turns (fetchLastTrickPlay)

    await useGameStore.getState().fetchGame('room-1')

    const state = useGameStore.getState()
    expect(state.gameId).toBe('g-finished')
    expect(state.status).toBe('finished')
    expect(state.turnNo).toBe(9)
    expect(state.currentSeat).toBe(2)
    expect(state.counts).toEqual([0, 1, 2, 3])
    expect(state.rankings).toEqual([0, 1, 2, 3])
    expect(state.myHand.map(c => c.id)).toEqual([2, 3, 1])
  })

  it('手牌排序在点数相同情况下按花色排序', async () => {
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'g-1',
            status: 'playing',
            turn_no: 1,
            current_seat: 0,
            state_public: { counts: [27, 27, 27, 27], rankings: [] },
          },
        ],
        error: null,
      }),
    }

    // room_members 查询，返回 seat_no
    const memberQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { seat_no: 0 },
        error: null,
      }),
    }

    // game_hands 查询，返回手牌数据
    const handQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          hand: [
            makeCard({ id: 1, suit: 'S', rank: '10', val: 10 }),
            makeCard({ id: 2, suit: 'H', rank: '10', val: 10 }),
            makeCard({ id: 3, suit: 'D', rank: 'J', val: 11 }),
          ],
        },
        error: null,
      }),
    }

    // turns 查询（fetchLastTrickPlay）
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)      // games
      .mockImplementationOnce(() => memberQuery)    // room_members
      .mockImplementationOnce(() => handQuery)      // game_hands
      .mockImplementationOnce(() => turnsQuery)     // turns

    await useGameStore.getState().fetchGame('room-1')
    // 排序逻辑：先按点数降序，点数相同按花色降序 (S > H > D)
    // D-J (11) > S-10 (10, S) > H-10 (10, H)
    expect(useGameStore.getState().myHand.map(c => c.id)).toEqual([3, 1, 2])
  })

  it('无对局时重置为deal', async () => {
    useGameStore.setState({
      gameId: 'g-old',
      status: 'playing',
      myHand: [makeCard({ id: 99 })],
      lastAction: { type: 'play', seatNo: 1, cards: [makeCard({ id: 98 })] },
      recentTurns: [{ turn_no: 1, seat_no: 1, payload: { type: 'play', cards: [makeCard({ id: 98 })] } }],
    })
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    }

    ;(supabase.from as any).mockImplementationOnce(() => gameQuery)

    await useGameStore.getState().fetchGame('room-1')

    expect(useGameStore.getState().gameId).toBeNull()
    expect(useGameStore.getState().status).toBe('deal')
    expect(useGameStore.getState().myHand).toEqual([])
    expect(useGameStore.getState().lastAction).toBeNull()
    expect(useGameStore.getState().recentTurns).toEqual([])
  })

  it('games查询错误时会提前返回', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: null, error: new Error('game error') }),
    }
    ;(supabase.from as any).mockImplementationOnce(() => gameQuery)
    await useGameStore.getState().fetchGame('room-1')
    expect(useGameStore.getState().status).toBe('deal')
    errSpy.mockRestore()
  })

  it('hands查询错误时不会更新myHand', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [{ id: 'g-1', status: 'playing', turn_no: 1, current_seat: 0, state_public: { counts: [27, 27, 27, 27], rankings: [] } }],
        error: null,
      }),
    }
    const handQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('hands error') }),
    }
    const gameHandsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('game_hands error') }),
    }
    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)
      .mockImplementationOnce(() => handQuery)
      .mockImplementationOnce(() => gameHandsQuery)
    await useGameStore.getState().fetchGame('room-1')
    expect(useGameStore.getState().gameId).toBe('g-1')
    expect(useGameStore.getState().myHand).toEqual([])
    errSpy.mockRestore()
  })
})

describe('useGameStore.getAIHand', () => {
  beforeEach(() => {
    ;(supabase.rpc as any).mockReset()
  })

  it('无gameId返回空数组', async () => {
    useGameStore.setState({ gameId: null })
    await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([])
  })

  it('rpc错误返回空数组', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useGameStore.setState({ gameId: 'g-1' })
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') })
    await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([])
    expect(errSpy).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('rpc成功返回手牌数组', async () => {
    useGameStore.setState({ gameId: 'g-1' })
    ;(supabase.rpc as any).mockResolvedValue({ data: [makeCard({ id: 1 })], error: null })
    await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([makeCard({ id: 1 })])
  })

  it('开发环境下rpc错误会记录日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withNodeEnv('development', async () => {
      useGameStore.setState({ gameId: 'g-1' })
      ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') })
      await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([])
      expect(errSpy).toHaveBeenCalled()
    })
    errSpy.mockRestore()
  })
})

describe('useGameStore.fetchLastTrickPlay', () => {
  beforeEach(() => {
    ;(supabase.from as any).mockReset()
  })

  it('无gameId返回null', async () => {
    useGameStore.setState({ gameId: null })
    await expect(useGameStore.getState().fetchLastTrickPlay()).resolves.toBeNull()
  })

  it('连续三次pass会返回null', async () => {
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null })
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { payload: { type: 'pass' }, seat_no: 1, turn_no: 3 },
          { payload: { type: 'pass' }, seat_no: 2, turn_no: 2 },
          { payload: { type: 'pass' }, seat_no: 3, turn_no: 1 },
        ],
      }),
    }
    ;(supabase.from as any).mockImplementationOnce(() => turnsQuery)

    await expect(useGameStore.getState().fetchLastTrickPlay()).resolves.toBeNull()
    expect(useGameStore.getState().recentTurns.length).toBe(3)
  })

  it('最后一次play由当前座位打出时返回null', async () => {
    useGameStore.setState({ gameId: 'g-1', currentSeat: 3 })
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { payload: { type: 'pass' }, seat_no: 1, turn_no: 3 },
          { payload: { type: 'pass' }, seat_no: 2, turn_no: 2 },
          { payload: { type: 'play', cards: [makeCard({ id: 5 })] }, seat_no: 3, turn_no: 1 },
        ],
      }),
    }
    ;(supabase.from as any).mockImplementationOnce(() => turnsQuery)
    await expect(useGameStore.getState().fetchLastTrickPlay()).resolves.toBeNull()
  })

  it('少于三次pass且没有play时返回null', async () => {
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null })
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { payload: { type: 'pass' }, seat_no: 1, turn_no: 2 },
          { payload: { type: 'pass' }, seat_no: 2, turn_no: 1 },
        ],
      }),
    }
    ;(supabase.from as any).mockImplementationOnce(() => turnsQuery)
    await expect(useGameStore.getState().fetchLastTrickPlay()).resolves.toBeNull()
  })

  it('找到未被三pass压掉的play则返回该play', async () => {
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null })
    const turnsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: [
          { payload: { type: 'pass' }, seat_no: 1, turn_no: 4 },
          { payload: { type: 'pass' }, seat_no: 2, turn_no: 3 },
          { payload: { type: 'play', cards: [makeCard({ id: 5 })] }, seat_no: 3, turn_no: 2 },
        ],
      }),
    }
    ;(supabase.from as any).mockImplementationOnce(() => turnsQuery)

    await expect(useGameStore.getState().fetchLastTrickPlay()).resolves.toEqual({
      type: 'play',
      cards: [makeCard({ id: 5 })],
      seatNo: 3,
    })
    expect(useGameStore.getState().recentTurns[0]?.payload?.type).toBe('pass')
  })
})

describe('useGameStore.fetchTurnsSince', () => {
  beforeEach(() => {
    ;(supabase.rpc as any).mockReset()
  })

  it('PGRST202时返回空数组', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: { code: 'PGRST202' } })
    await expect(useGameStore.getState().fetchTurnsSince('g-1', 0)).resolves.toEqual([])
  })

  it('成功时返回turns数组', async () => {
    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 1, seat_no: 0, payload: { type: 'pass' } }],
      error: null,
    })
    await expect(useGameStore.getState().fetchTurnsSince('g-1', 0)).resolves.toEqual([
      { turn_no: 1, seat_no: 0, payload: { type: 'pass' } },
    ])
  })

  it('同一game下增量补拉会合并recentTurns并更新lastAction', async () => {
    useGameStore.setState({
      gameId: 'g-1',
      currentSeat: 0,
      recentTurns: [{ turn_no: 2, seat_no: 3, payload: { type: 'play', cards: [makeCard({ id: 5 })] } }],
      lastAction: { type: 'play', seatNo: 3, cards: [makeCard({ id: 5 })] },
    })

    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 3, seat_no: 1, payload: { type: 'pass' } }],
      error: null,
    })

    await useGameStore.getState().fetchTurnsSince('g-1', 2)
    expect(useGameStore.getState().recentTurns.map(t => t.turn_no)).toEqual([3, 2])
    expect(useGameStore.getState().lastAction?.seatNo).toBe(3)
  })


  it('其它错误时抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: { code: 'X', message: 'fail' } })
    await expect(useGameStore.getState().fetchTurnsSince('g-1', 0)).rejects.toBeDefined()
    expect(errSpy).not.toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('增量补拉只有pass且不足三次时lastAction保持null', async () => {
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null })
    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 1, seat_no: 1, payload: { type: 'pass' } }],
      error: null,
    })
    await useGameStore.getState().fetchTurnsSince('g-1', 0)
    expect(useGameStore.getState().lastAction).toBeNull()
  })

  it('增量补拉累计三次pass后lastAction为null', async () => {
    useGameStore.setState({
      gameId: 'g-1',
      currentSeat: 0,
      recentTurns: [
        { turn_no: 2, seat_no: 2, payload: { type: 'pass' } },
        { turn_no: 1, seat_no: 3, payload: { type: 'pass' } },
      ],
      lastAction: { type: 'play', seatNo: 1, cards: [makeCard({ id: 5 })] },
    })
    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 3, seat_no: 1, payload: { type: 'pass' } }],
      error: null,
    })
    await useGameStore.getState().fetchTurnsSince('g-1', 2)
    expect(useGameStore.getState().lastAction).toBeNull()
  })
})

describe('useGameStore.subscribeGame', () => {
  beforeEach(() => {
    ;(supabase.channel as any).mockReset()
    ;(supabase.removeChannel as any).mockReset()
    useGameStore.setState({
      recentTurns: [],
      lastAction: null,
      fetchTurnsSince: originalFetchTurnsSince as any,
      fetchLastTrickPlay: originalFetchLastTrickPlay as any,
    })
  })

  it('返回的取消订阅函数会移除channel', () => {
    const channelObj = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValue(channelObj)

    const unsub = useGameStore.getState().subscribeGame('room-1')
    unsub()

    expect(supabase.removeChannel).toHaveBeenCalledWith(channelObj)
  })

  it('存在gameId时会同时订阅turns并在取消时移除两个channel', () => {
    const gamesChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const turnsChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    useGameStore.setState({ gameId: 'g-1' })
    const unsub = useGameStore.getState().subscribeGame('room-1')
    unsub()

    expect(supabase.removeChannel).toHaveBeenCalledWith(gamesChannel)
    expect(supabase.removeChannel).toHaveBeenCalledWith(turnsChannel)
  })

  it('games变更时会更新store并在需要时触发fetchGame', async () => {
    const handlers: any[] = []
    const channelObj = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        handlers.push(cb)
        return channelObj
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValue(channelObj)

    const fetchGame = vi.fn().mockResolvedValue(undefined)
    useGameStore.setState({ fetchGame: fetchGame as any })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await handlers[0]({
      eventType: 'INSERT',
      new: { id: 'g-1', status: 'playing', turn_no: 0, current_seat: 0, state_public: { counts: [27, 27, 27, 27], rankings: [] } },
      old: null,
    })

    expect(useGameStore.getState().gameId).toBe('g-1')
    expect(fetchGame).toHaveBeenCalledWith('room-1')

    unsub()
  })

  it('turn跳跃时会触发增量补拉并刷新lastAction', async () => {
    const handlers: any[] = []
    const channelObj = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        handlers.push(cb)
        return channelObj
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValue(channelObj)

    const fetchTurnsSince = vi.fn().mockResolvedValue([])
    const fetchLastTrickPlay = vi.fn().mockResolvedValue({ type: 'play', seatNo: 1, cards: [makeCard({ id: 1 })] })
    useGameStore.setState({
      gameId: 'g-1',
      turnNo: 1,
      fetchTurnsSince: fetchTurnsSince as any,
      fetchLastTrickPlay: fetchLastTrickPlay as any,
    })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await handlers[0]({
      eventType: 'UPDATE',
      new: { id: 'g-1', status: 'playing', turn_no: 4, current_seat: 2, state_public: { counts: [27, 27, 27, 27], rankings: [] } },
      old: { status: 'playing', turn_no: 1 },
    })

    expect(fetchTurnsSince).toHaveBeenCalledWith('g-1', 1)
    expect(fetchLastTrickPlay).toHaveBeenCalled()
    expect(useGameStore.getState().lastAction?.type).toBe('play')

    unsub()
  })

  it('turn跳跃时增量补拉有数据则不会触发fetchLastTrickPlay兜底', async () => {
    const gameHandlers: any[] = []
    const gamesChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        gameHandlers.push(cb)
        return gamesChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    const turnsChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    const fetchLastTrickPlay = vi.fn().mockResolvedValue(null)
    useGameStore.setState({
      gameId: 'g-1',
      turnNo: 1,
      currentSeat: 0,
      recentTurns: [],
      lastAction: null,
      fetchLastTrickPlay: fetchLastTrickPlay as any,
    })

    ;(supabase.rpc as any).mockResolvedValue({
      data: [{ turn_no: 2, seat_no: 3, payload: { type: 'play', cards: [makeCard({ id: 5 })] } }],
      error: null,
    })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await gameHandlers[0]({
      eventType: 'UPDATE',
      new: { id: 'g-1', status: 'playing', turn_no: 4, current_seat: 2, state_public: { counts: [27, 27, 27, 27], rankings: [] } },
      old: { status: 'playing', turn_no: 1 },
    })

    expect(supabase.rpc).toHaveBeenCalled()
    expect(fetchLastTrickPlay).not.toHaveBeenCalled()
    expect(useGameStore.getState().lastAction).toEqual({ type: 'play', seatNo: 3, cards: [makeCard({ id: 5 })] })

    unsub()
  })

  it('rankings增长时会触发fetchGame强制刷新', async () => {
    const handlers: any[] = []
    const channelObj = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        handlers.push(cb)
        return channelObj
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValue(channelObj)

    const fetchGame = vi.fn().mockResolvedValue(undefined)
    useGameStore.setState({ rankings: [], fetchGame: fetchGame as any })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await handlers[0]({
      eventType: 'UPDATE',
      new: { id: 'g-1', status: 'playing', turn_no: 1, current_seat: 1, state_public: { counts: [27, 27, 27, 27], rankings: [0] } },
      old: { status: 'playing', turn_no: 0 },
    })

    expect(fetchGame).toHaveBeenCalledWith('room-1')
    unsub()
  })

  it('turns插入事件会在当前game下刷新lastAction', async () => {
    const gameHandlers: any[] = []
    const turnsHandlers: any[] = []
    const gamesChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        gameHandlers.push(cb)
        return gamesChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    const turnsChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        turnsHandlers.push(cb)
        return turnsChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await turnsHandlers[0]({ new: { turn_no: 1, seat_no: 2, payload: { type: 'play', cards: [makeCard({ id: 9 })] } } })
    expect(useGameStore.getState().lastAction).toEqual({ type: 'play', seatNo: 2, cards: [makeCard({ id: 9 })] })

    unsub()
  })

  it('turns插入事件在turn_no非数字时会fallback到fetchLastTrickPlay', async () => {
    const turnsHandlers: any[] = []
    const gamesChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const turnsChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        turnsHandlers.push(cb)
        return turnsChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    const fetchLastTrickPlay = vi.fn().mockResolvedValue({ type: 'play', seatNo: 1, cards: [makeCard({ id: 7 })] })
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0, recentTurns: [], lastAction: null, fetchLastTrickPlay: fetchLastTrickPlay as any })

    const unsub = useGameStore.getState().subscribeGame('room-1')
    await turnsHandlers[0]({ new: { turn_no: '1', seat_no: 2, payload: { type: 'pass' } } })

    expect(fetchLastTrickPlay).toHaveBeenCalled()
    expect(useGameStore.getState().lastAction).toEqual({ type: 'play', seatNo: 1, cards: [makeCard({ id: 7 })] })

    unsub()
  })

  it('turns插入连续三次pass后lastAction会变为null', async () => {
    const turnsHandlers: any[] = []
    const gamesChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const turnsChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        turnsHandlers.push(cb)
        return turnsChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    useGameStore.setState({
      gameId: 'g-1',
      currentSeat: 0,
      recentTurns: [
        { turn_no: 3, seat_no: 1, payload: { type: 'pass' } },
        { turn_no: 2, seat_no: 3, payload: { type: 'pass' } },
        { turn_no: 1, seat_no: 2, payload: { type: 'play', cards: [makeCard({ id: 5 })] } },
      ],
      lastAction: { type: 'play', seatNo: 2, cards: [makeCard({ id: 5 })] },
    })

    const unsub = useGameStore.getState().subscribeGame('room-1')
    await turnsHandlers[0]({ new: { turn_no: 4, seat_no: 0, payload: { type: 'pass' } } })
    expect(useGameStore.getState().lastAction).toBeNull()
    unsub()
  })

  it('subscribeGame会将subscribe状态回传给onStatus', () => {
    const onStatus = vi.fn()
    const gamesChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const turnsChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannel)

    useGameStore.setState({ gameId: 'g-1' })
    const unsub = useGameStore.getState().subscribeGame('room-1', { onStatus })

    const gamesSubscribeCb = (gamesChannel.subscribe as any).mock.calls[0]?.[0]
    const turnsSubscribeCb = (turnsChannel.subscribe as any).mock.calls[0]?.[0]
    expect(typeof gamesSubscribeCb).toBe('function')
    expect(typeof turnsSubscribeCb).toBe('function')

    gamesSubscribeCb('SUBSCRIBED')
    turnsSubscribeCb('SUBSCRIBED')
    expect(onStatus).toHaveBeenCalledWith('SUBSCRIBED')

    unsub()
  })

  it('gameId变化时会切换turns订阅并重置recentTurns与lastAction', async () => {
    const gameHandlers: any[] = []
    const gamesChannel = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        gameHandlers.push(cb)
        return gamesChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    const turnsChannelA = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const turnsChannelB = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(gamesChannel).mockReturnValueOnce(turnsChannelA).mockReturnValueOnce(turnsChannelB)

    useGameStore.setState({
      gameId: 'g-1',
      recentTurns: [{ turn_no: 1, seat_no: 1, payload: { type: 'play', cards: [makeCard({ id: 5 })] } }],
      lastAction: { type: 'play', seatNo: 1, cards: [makeCard({ id: 5 })] },
    })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await gameHandlers[0]({
      eventType: 'UPDATE',
      new: { id: 'g-2', status: 'playing', turn_no: 0, current_seat: 0, state_public: { counts: [27, 27, 27, 27], rankings: [] } },
      old: { status: 'playing', turn_no: 10 },
    })

    expect(supabase.removeChannel).toHaveBeenCalledWith(turnsChannelA)
    expect(useGameStore.getState().recentTurns).toEqual([])
    expect(useGameStore.getState().lastAction).toBeNull()

    unsub()
  })
})

describe('useGameStore.startGame', () => {
  beforeEach(() => {
    ;(supabase.rpc as any).mockReset()
  })

  it('成功后会触发fetchGame刷新', async () => {
    const fetchGame = vi.fn().mockResolvedValue(undefined)
    useGameStore.setState({ fetchGame: fetchGame as any })
    ;(supabase.rpc as any).mockResolvedValue({ error: null })

    await useGameStore.getState().startGame('room-1')

    expect(fetchGame).toHaveBeenCalledWith('room-1')
  })

  it('失败时会抛出错误', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ error: new Error('fail') })
    await expect(useGameStore.getState().startGame('room-1')).rejects.toBeDefined()
  })
})
