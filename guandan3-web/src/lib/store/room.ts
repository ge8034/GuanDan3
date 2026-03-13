import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface Room {
  id: string
  mode: 'pvp4' | 'pve1v3'
  type: string // e.g. 'classic'
  name?: string
  status: 'open' | 'playing' | 'closed'
  owner_uid: string
}

export interface RoomMember {
  uid: string | null
  seat_no: number
  ready: boolean
  online?: boolean
  last_seen_at?: string
  member_type: 'human' | 'ai'
  ai_key?: string
}

interface RoomState {
  currentRoom: Room | null
  members: RoomMember[]
  setRoom: (room: Room | null) => void
  setMembers: (members: RoomMember[]) => void
  fetchRoom: (roomId: string) => Promise<void>
  subscribeRoom: (roomId: string) => () => void
  createRoom: (name: string, type: string, mode: string, visibility: string) => Promise<{ id: string } | null>
  joinRoom: (roomId: string, seatNo?: number) => Promise<boolean>
  toggleReady: (roomId: string, ready: boolean) => Promise<void>
  leaveRoom: (roomId: string) => Promise<void>
  heartbeatRoomMember: (roomId: string) => Promise<void>
  sweepOfflineMembers: (roomId: string, timeoutSeconds?: number) => Promise<number>
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  members: [],
  setRoom: (room) => set({ currentRoom: room }),
  setMembers: (members) => set({ members }),
  
  heartbeatRoomMember: async (roomId) => {
    const { error } = await supabase.rpc('heartbeat_room_member', {
      p_room_id: roomId
    })
    if (error) {
      if ((error as any)?.code === 'PGRST202') return
      console.error('Heartbeat room member error:', error)
      throw error
    }
  },

  sweepOfflineMembers: async (roomId, timeoutSeconds = 15) => {
    const { data, error } = await supabase.rpc('sweep_offline_members', {
      p_room_id: roomId,
      p_timeout_seconds: timeoutSeconds
    })
    if (error) {
      if ((error as any)?.code === 'PGRST202') return 0
      console.error('Sweep offline members error:', error)
      throw error
    }
    return (data as unknown as number) ?? 0
  },
  
  leaveRoom: async (roomId) => {
    const { error } = await supabase.rpc('leave_room', {
      p_room_id: roomId
    })
    
    if (error) {
      console.error('Leave room error:', error)
      throw error
    }
    set({ currentRoom: null, members: [] })
  },

  toggleReady: async (roomId, ready) => {
    const { error } = await supabase.rpc('toggle_ready', {
      p_room_id: roomId,
      p_ready: ready
    })
    
    if (error) {
      console.error('Toggle ready error:', error)
      throw error
    }
    // Optimistic update or wait for subscription
    await get().fetchRoom(roomId)
  },

  createRoom: async (name, type, mode, visibility) => {
    const { data, error } = await supabase.rpc('create_room', {
      p_name: name,
      p_type: type,
      p_mode: mode,
      p_visibility: visibility
    })
    
    if (error) {
      console.error('Create room error:', error)
      throw error
    }
    return data ? { id: data } : null
  },

  joinRoom: async (roomId, seatNo) => {
    const { data, error } = await supabase.rpc('join_room', {
      p_room_id: roomId,
      p_seat_no: seatNo
    })
    
    if (error) {
      console.error('Join room error:', error)
      throw error
    }
    // Refresh room data after joining
    await get().fetchRoom(roomId)
    return !!data
  },
  
  fetchRoom: async (roomId) => {
    // 1. Fetch Room
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    
    if (roomError) {
      console.error('Fetch room error:', roomError)
      return
    }
    set({ currentRoom: room })

    // 2. Fetch Members
    const { data: members, error: membersError } = await supabase
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .order('seat_no')
    
    if (membersError) {
      console.error('Fetch members error:', membersError)
      return
    }
    set({ members: members || [] })
  },

  subscribeRoom: (roomId) => {
    // Subscribe to Room changes
    const roomChannel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        (payload) => {
          set({ currentRoom: payload.new as Room })
        }
      )
      .subscribe()

    // Subscribe to Member changes
    const memberChannel = supabase
      .channel(`members:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => {
          // Refresh members on any change
          get().fetchRoom(roomId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(memberChannel)
    }
  }
}))
