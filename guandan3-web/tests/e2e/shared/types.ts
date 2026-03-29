/**
 * E2E测试共享类型定义
 */

export interface MockCard {
  id: number
  suit: 'S' | 'H' | 'D' | 'C' | 'J'
  rank: string
  val: number
}

export interface MockRoom {
  id: string
  name: string
  mode: 'pvp4' | 'pve1v3' | 'practice'
  type: string
  status: 'open' | 'playing' | 'closed' | 'finished'
  visibility: 'public' | 'private'
  owner_uid: string
  created_at: string
  updated_at: string
  room_members?: MockRoomMember[]
}

export interface MockRoomMember {
  id: string
  room_id: string
  seat_no: number
  uid: string | null
  member_type: 'human' | 'ai'
  ready: boolean
  online: boolean
  ai_key?: string
}

export interface MockGame {
  id: string
  room_id: string
  status: 'playing' | 'paused' | 'finished'
  turn_no: number
  current_seat: number
  level_rank: number
  state_public: {
    counts: number[]
    rankings: number[]
    levelRank: number
  }
  state_private?: {
    hands: Record<string, MockCard[]>
  }
  created_at: string
}

export interface MockGameHand {
  id: string
  game_id: string
  uid: string
  hand: MockCard[]
  updated_at: string
}

export interface MockAuthUser {
  id: string
  aud: string
  role: string
  email: string
  app_metadata: { provider: string }
  user_metadata: Record<string, unknown>
  created_at: string
}

export interface MockTestState {
  mockRooms: MockRoom[]
  mockGameId: string
  mockRoomId: string
  mockHandCards: MockCard[]
  currentSeat: number
  turnNo: number
}

// 超时常量
export const MOCK_TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 5000,
  LONG: 30000,
  XLONG: 60000,
} as const

// 座位常量
export const PLAYER_SEAT = 0
export const AI_SEAT_1 = 1
export const AI_SEAT_2 = 2
export const AI_SEAT_3 = 3
