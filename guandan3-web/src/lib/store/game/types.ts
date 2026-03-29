import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * 卡牌类型定义
 */
export interface Card {
  suit: 'H' | 'D' | 'C' | 'S' | 'J'
  rank: string
  val: number
  id: number
}

/**
 * 出牌动作负载类型
 */
export type TurnPayload = { type: 'play' | 'pass'; cards?: Card[] }

/**
 * 回合记录类型
 */
export type TurnRow = { turn_no: number; seat_no: number; payload: TurnPayload }

/**
 * 最后一个出牌动作类型
 */
export type LastAction = { seatNo: number; type: 'play' | 'pass'; cards?: Card[] } | null

/**
 * Supabase 游戏记录类型
 */
export type GameRow = {
  id: string
  room_id: string
  status: 'deal' | 'playing' | 'paused' | 'finished'
  turn_no: number
  current_seat: number
  state_public?: {
    counts?: number[]
    rankings?: number[]
    levelRank?: number
  }
  state_private?: {
    hands?: Record<string, Card[]>
  }
}

/**
 * 游戏状态接口
 */
export interface GameState {
  // 基础状态
  gameId: string | null
  status: 'deal' | 'playing' | 'paused' | 'finished'
  turnNo: number
  currentSeat: number
  levelRank: number
  recentTurns: TurnRow[]
  myHand: Card[]
  lastAction: LastAction
  scores: Record<string, number>
  counts: number[] // 每个座位剩余牌数
  rankings: number[] // 完成顺序 [seatNo, seatNo, ...]

  // 暂停状态
  pausedBy: string | null
  pausedAt: string | null
  pauseReason: string | null

  // 进贡状态
  tributePhase: boolean
  tributeFrom: number[] // 需要进贡的座位
  tributeTo: number[] // 接收进贡的座位
  resistTribute: number[] // 抗贡的座位
  tributeCards: Record<number, Card[]> // 每个座位进贡的牌
  returnCards: Record<number, Card[]> // 每个座位返还的牌

  // Actions
  setGame: (data: Partial<GameState>) => void
  resetGame: () => void
  updateHand: (cards: Card[]) => void
  playTurn: (cards: Card[]) => Promise<void>
  fetchGame: (roomId: string) => Promise<void>
  subscribeGame: (roomId: string, options?: { onStatus?: (status: string) => void }) => () => void
  startGame: (roomId: string) => Promise<void>
  submitTurn: (type: 'play' | 'pass', cards?: Card[]) => Promise<unknown>
  getAIHand: (seatNo: number) => Promise<Card[]>
  fetchLastTrickPlay: () => Promise<LastAction>
  fetchTurnsSince: (gameId: string, fromTurnNo: number) => Promise<TurnRow[]>
  calculateTribute: () => Promise<void>
  submitTribute: (tributeCard: Card) => Promise<void>
  submitReturn: (returnCard: Card) => Promise<void>
  pauseGame: (reason?: string) => Promise<void>
  resumeGame: () => Promise<void>
}

/**
 * 初始游戏状态
 */
export const initialGameState: Partial<GameState> = {
  gameId: null,
  status: 'deal',
  turnNo: 0,
  currentSeat: 0,
  levelRank: 2,
  recentTurns: [],
  myHand: [],
  lastAction: null,
  scores: {},
  counts: [27, 27, 27, 27],
  rankings: [],
  pausedBy: null,
  pausedAt: null,
  pauseReason: null,
  tributePhase: false,
  tributeFrom: [],
  tributeTo: [],
  resistTribute: [],
  tributeCards: {},
  returnCards: {},
}
