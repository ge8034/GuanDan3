import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase/client', () => {
  const chain = () => {
    const api: any = {}
    api.select = vi.fn(() => api)
    api.eq = vi.fn(() => api)
    api.in = vi.fn(() => api)
    api.order = vi.fn(() => api)
    api.limit = vi.fn(() => api)
    api.maybeSingle = vi.fn()
    api.single = vi.fn()
    return api
  }

  const supabase: any = {
    rpc: vi.fn(),
    from: vi.fn(() => chain()),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })),
    removeChannel: vi.fn(),
  }

  return { supabase }
})

import { supabase } from '@/lib/supabase/client'
import { useGameStore, type Card } from '@/lib/store/game'

const makeCard = (overrides: Partial<Card> = {}): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...overrides,
})

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
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'g-finished',
          status: 'finished',
          turn_no: 9,
          current_seat: 2,
          state_public: { counts: [0, 1, 2, 3], rankings: [0, 1, 2, 3] },
        },
        error: null,
      }),
    }

    const handQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            hand: [
              makeCard({ id: 1, suit: 'H', rank: '2', val: 2 }),
              makeCard({ id: 2, suit: 'S', rank: 'A', val: 14 }),
              makeCard({ id: 3, suit: 'D', rank: 'K', val: 13 }),
            ],
          },
        ],
        error: null,
      }),
    }

    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)
      .mockImplementationOnce(() => handQuery)

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
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'g-1',
          status: 'playing',
          turn_no: 1,
          current_seat: 0,
          state_public: { counts: [27, 27, 27, 27], rankings: [] },
        },
        error: null,
      }),
    }
    const handQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            hand: [
              makeCard({ id: 1, suit: 'S', rank: '10', val: 10 }),
              makeCard({ id: 2, suit: 'H', rank: '10', val: 10 }),
              makeCard({ id: 3, suit: 'D', rank: 'J', val: 11 }),
            ],
          },
        ],
        error: null,
      }),
    }
    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)
      .mockImplementationOnce(() => handQuery)
    await useGameStore.getState().fetchGame('room-1')
    expect(useGameStore.getState().myHand.map(c => c.id)).toEqual([3, 2, 1])
  })

  it('无对局时重置为deal', async () => {
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }

    ;(supabase.from as any).mockImplementationOnce(() => gameQuery)

    await useGameStore.getState().fetchGame('room-1')

    expect(useGameStore.getState().gameId).toBeNull()
    expect(useGameStore.getState().status).toBe('deal')
  })

  it('games查询错误时会提前返回', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const gameQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('game error') }),
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
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'g-1', status: 'playing', turn_no: 1, current_seat: 0, state_public: { counts: [27, 27, 27, 27], rankings: [] } },
        error: null,
      }),
    }
    const handQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: new Error('hands error') }),
    }
    ;(supabase.from as any)
      .mockImplementationOnce(() => gameQuery)
      .mockImplementationOnce(() => handQuery)
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
    useGameStore.setState({ gameId: 'g-1' })
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') })
    await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([])
  })

  it('rpc成功返回手牌数组', async () => {
    useGameStore.setState({ gameId: 'g-1' })
    ;(supabase.rpc as any).mockResolvedValue({ data: [makeCard({ id: 1 })], error: null })
    await expect(useGameStore.getState().getAIHand(1)).resolves.toEqual([makeCard({ id: 1 })])
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
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0 })
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
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0 })
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
    useGameStore.setState({ gameId: 'g-1', currentSeat: 0 })
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

  it('其它错误时抛出异常', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: { code: 'X', message: 'fail' } })
    await expect(useGameStore.getState().fetchTurnsSince('g-1', 0)).rejects.toBeDefined()
  })
})

describe('useGameStore.subscribeGame', () => {
  beforeEach(() => {
    ;(supabase.channel as any).mockReset()
    ;(supabase.removeChannel as any).mockReset()
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
    const handlers: any[] = []
    const channelObj = {
      on: vi.fn((_type: any, _filter: any, cb: any) => {
        handlers.push(cb)
        return channelObj
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValue(channelObj)

    const fetchLastTrickPlay = vi.fn().mockResolvedValue({ type: 'play', seatNo: 1, cards: [makeCard({ id: 9 })] })
    useGameStore.setState({ gameId: 'g-1', fetchLastTrickPlay: fetchLastTrickPlay as any })

    const unsub = useGameStore.getState().subscribeGame('room-1')

    await handlers[1]({ new: { game_id: 'g-1' } })
    expect(fetchLastTrickPlay).toHaveBeenCalled()
    expect(useGameStore.getState().lastAction?.type).toBe('play')

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
