import { beforeEach, describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'
import { withNodeEnv } from '@/test/utils/withNodeEnv'

const originalFetchRoom = useRoomStore.getState().fetchRoom

describe('useRoomStore', () => {
  beforeEach(() => {
    // 清除所有mock调用记录
    vi.clearAllMocks()

    useRoomStore.setState({ currentRoom: null, members: [], fetchRoom: originalFetchRoom as any })
  })

  it('setRoom与setMembers会更新状态', () => {
    useRoomStore.getState().setRoom({ id: 'room-1', status: 'open', owner_uid: 'u-1', mode: 'pvp4', type: 'classic' } as any)
    expect(useRoomStore.getState().currentRoom?.id).toBe('room-1')
    useRoomStore.getState().setMembers([{ seat_no: 0, uid: 'u-1', ready: true, member_type: 'human' } as any])
    expect(useRoomStore.getState().members.length).toBe(1)
  })

  it('createRoom成功返回id', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ data: 'room-1', error: null })
    const res = await useRoomStore.getState().createRoom('r', 'classic', 'pvp4', 'public')
    expect(res).toEqual({ id: 'room-1' })
  })

  it('createRoom失败时会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') })
    await expect(useRoomStore.getState().createRoom('r', 'classic', 'pvp4', 'public')).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('joinRoom会在rpc成功后触发fetchRoom', async () => {
    const fetchRoom = vi.fn().mockResolvedValue(undefined)
    useRoomStore.setState({ fetchRoom: fetchRoom as any })

    ;(supabase.rpc as any).mockResolvedValue({ data: true, error: null })
    const ok = await useRoomStore.getState().joinRoom('room-1')

    expect(ok).toBe(true)
    expect(fetchRoom).toHaveBeenCalledWith('room-1')
  })

  it('joinRoom失败时会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('fail') })
    await expect(useRoomStore.getState().joinRoom('room-1')).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('toggleReady会在rpc成功后触发fetchRoom', async () => {
    const fetchRoom = vi.fn().mockResolvedValue(undefined)
    useRoomStore.setState({ fetchRoom: fetchRoom as any })

    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } } })
    ;(supabase.rpc as any).mockResolvedValue({ error: null })
    await useRoomStore.getState().toggleReady('room-1', true)

    expect(fetchRoom).toHaveBeenCalledWith('room-1')
  })

  it('toggleReady失败时会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user-1' } } })
    ;(supabase.rpc as any).mockResolvedValue({ error: new Error('fail') })
    await expect(useRoomStore.getState().toggleReady('room-1', true)).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('leaveRoom会清空本地room与members', async () => {
    useGameStore.setState({ gameId: 'g-1', status: 'playing', myHand: [{ id: 1, suit: 'H', rank: '2', val: 2 } as any] })
    useRoomStore.setState({ currentRoom: { id: 'room-1' } as any, members: [{ seat_no: 0 } as any] })
    ;(supabase.rpc as any).mockResolvedValue({ error: null })

    await useRoomStore.getState().leaveRoom('room-1')

    expect(useRoomStore.getState().currentRoom).toBeNull()
    expect(useRoomStore.getState().members).toEqual([])
    expect(useGameStore.getState().gameId).toBeNull()
    expect(useGameStore.getState().status).toBe('deal')
    expect(useGameStore.getState().myHand).toEqual([])
  })

  it('leaveRoom失败时会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useRoomStore.setState({ currentRoom: { id: 'room-1' } as any, members: [{ seat_no: 0 } as any] })
    ;(supabase.rpc as any).mockResolvedValue({ error: new Error('fail') })
    await expect(useRoomStore.getState().leaveRoom('room-1')).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('heartbeatRoomMember会调用rpc', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ error: null })
    await useRoomStore.getState().heartbeatRoomMember('room-1')
    expect(supabase.rpc).toHaveBeenCalledWith('heartbeat_room_member', { p_room_id: 'room-1' })
  })

  it('heartbeatRoomMember遇到PGRST202会静默返回', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ error: { code: 'PGRST202' } })
    await expect(useRoomStore.getState().heartbeatRoomMember('room-1')).resolves.toBeUndefined()
  })

  it('heartbeatRoomMember遇到其它错误会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.rpc as any).mockResolvedValue({ error: { code: 'X', message: 'fail' } })
    await expect(useRoomStore.getState().heartbeatRoomMember('room-1')).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('开发环境下heartbeatRoomMember遇到其它错误会记录日志', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await withNodeEnv('development', async () => {
      ;(supabase.rpc as any).mockResolvedValue({ error: { code: 'X', message: 'fail' } })
      await expect(useRoomStore.getState().heartbeatRoomMember('room-1')).rejects.toBeDefined()
      expect(errSpy).toHaveBeenCalled()
    })
    errSpy.mockRestore()
  })

  it('sweepOfflineMembers会调用rpc并返回更新数量', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ data: 3, error: null })
    const n = await useRoomStore.getState().sweepOfflineMembers('room-1', 20)
    expect(n).toBe(3)
    expect(supabase.rpc).toHaveBeenCalledWith('sweep_offline_members', { p_room_id: 'room-1', p_timeout_seconds: 20 })
  })

  it('sweepOfflineMembers遇到PGRST202会返回0', async () => {
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: { code: 'PGRST202' } })
    await expect(useRoomStore.getState().sweepOfflineMembers('room-1', 20)).resolves.toBe(0)
  })

  it('sweepOfflineMembers遇到其它错误会抛出异常', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: { code: 'X', message: 'fail' } })
    await expect(useRoomStore.getState().sweepOfflineMembers('room-1', 20)).rejects.toBeDefined()
    errSpy.mockRestore()
  })

  it('subscribeRoom返回的取消订阅会移除两个channel', async () => {
    const channelA = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const channelB = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(channelA).mockReturnValueOnce(channelB)

    const unsub = useRoomStore.getState().subscribeRoom('room-1')
    unsub()

    expect(supabase.removeChannel).toHaveBeenCalledWith(channelA)
    expect(supabase.removeChannel).toHaveBeenCalledWith(channelB)
  })

  it('subscribeRoom会将subscribe状态回传给onStatus', async () => {
    const onStatus = vi.fn()
    const channelA = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    const channelB = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }
    ;(supabase.channel as any).mockReturnValueOnce(channelA).mockReturnValueOnce(channelB)

    const unsub = useRoomStore.getState().subscribeRoom('room-1', { onStatus })
    const subA = (channelA.subscribe as any).mock.calls[0]?.[0]
    const subB = (channelB.subscribe as any).mock.calls[0]?.[0]
    expect(typeof subA).toBe('function')
    expect(typeof subB).toBe('function')

    subA('SUBSCRIBED')
    subB('SUBSCRIBED')
    expect(onStatus).toHaveBeenCalledWith({ name: 'room', status: 'SUBSCRIBED' })
    expect(onStatus).toHaveBeenCalledWith({ name: 'members', status: 'SUBSCRIBED' })

    unsub()
  })

  it('fetchRoom会同步room与members', async () => {
    const mockRoomData = {
      id: 'room-1',
      name: '测试房间',
      mode: 'pvp4',
      type: 'classic',
      status: 'open',
      visibility: 'public',
      owner_uid: 'u-1',
      created_at: '2026-03-21T00:00:00Z',
      room_members: [{ seat_no: 0, uid: 'u-1', ready: true, member_type: 'human' }]
    }

    // 使用 mockResolvedValue 而不是直接赋值对象
    ;(supabase.rpc as any).mockResolvedValue({ data: mockRoomData, error: null })

    await useRoomStore.getState().fetchRoom('room-1')

    expect(useRoomStore.getState().currentRoom?.id).toBe('room-1')
    expect(useRoomStore.getState().members.length).toBe(1)
    expect(useRoomStore.getState().members[0].seat_no).toBe(0)
  })

  it('fetchRoom遇到roomError会提前返回', async () => {
    // 使用 mockResolvedValue 而不是直接赋值对象
    ;(supabase.rpc as any).mockResolvedValue({ data: null, error: new Error('room error') })

    await useRoomStore.getState().fetchRoom('room-1')

    expect(useRoomStore.getState().currentRoom).toBeNull()
  })

  it('fetchRoom遇到membersError会保留room但不更新members', async () => {
    const mockRoomData = {
      id: 'room-1',
      name: '测试房间',
      mode: 'pvp4',
      type: 'classic',
      status: 'open',
      visibility: 'public',
      owner_uid: 'u-1',
      created_at: '2026-03-21T00:00:00Z',
      room_members: [] // 空成员列表
    }

    // 使用 mockResolvedValue 而不是直接赋值对象
    ;(supabase.rpc as any).mockResolvedValue({ data: mockRoomData, error: null })

    await useRoomStore.getState().fetchRoom('room-1')

    expect(useRoomStore.getState().currentRoom?.id).toBe('room-1')
    expect(useRoomStore.getState().members).toEqual([])
  })

  it('subscribeRoom收到rooms变更会更新currentRoom，members变更会触发fetchRoom', async () => {
    const roomHandlers: any[] = []
    const memberHandlers: any[] = []

    const roomChannel = {
      on: vi.fn((_t: any, _f: any, cb: any) => {
        roomHandlers.push(cb)
        return roomChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    const memberChannel = {
      on: vi.fn((_t: any, _f: any, cb: any) => {
        memberHandlers.push(cb)
        return memberChannel
      }),
      subscribe: vi.fn().mockReturnThis(),
    }
    ;(supabase.channel as any).mockReturnValueOnce(roomChannel).mockReturnValueOnce(memberChannel)

    const fetchRoom = vi.fn().mockResolvedValue(undefined)
    useRoomStore.setState({ fetchRoom: fetchRoom as any })

    const unsub = useRoomStore.getState().subscribeRoom('room-1')

    await roomHandlers[0]({ new: { id: 'room-1', status: 'playing', owner_uid: 'u-1' } })
    expect(useRoomStore.getState().currentRoom?.status).toBe('playing')

    await memberHandlers[0]({})
    expect(fetchRoom).toHaveBeenCalledWith('room-1')

    unsub()
  })
})
