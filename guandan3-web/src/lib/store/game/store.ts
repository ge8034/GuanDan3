import { create } from 'zustand'
import type { GameState, Card, initialGameState } from './types'
import * as gameActions from './actions/gameActions'
import * as turnActions from './actions/turnActions'
import * as tributeActions from './actions/tributeActions'
import * as pauseActions from './actions/pauseActions'
import * as subscriptionActions from './actions/subscriptionActions'

/**
 * 游戏状态管理 Store
 */
export const useGameStore = create<GameState>((set, get) => ({
  // 初始状态
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

  // 暂停状态
  pausedBy: null,
  pausedAt: null,
  pauseReason: null,

  // 进贡状态
  tributePhase: false,
  tributeFrom: [],
  tributeTo: [],
  resistTribute: [],
  tributeCards: {},
  returnCards: {},

  // 基础操作
  setGame: (data) => set((state) => ({ ...state, ...data })),
  resetGame: () => set({
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
  }),
  updateHand: (cards) => set({ myHand: cards }),

  // 游戏操作 - 使用 .call() 绑定 this 上下文
  fetchGame: (roomId) => gameActions.fetchGame.call(get(), roomId),
  startGame: (roomId) => gameActions.startGame.call(get(), roomId),
  getAIHand: (seatNo) => gameActions.getAIHand.call(get(), seatNo),
  fetchLastTrickPlay: () => gameActions.fetchLastTrickPlay.call(get()),
  fetchTurnsSince: (gameId: string, turnNo: number) => gameActions.fetchTurnsSince.call(get(), gameId, turnNo),

  // 回合操作
  playTurn: (cards) => turnActions.playTurn.call(get(), cards),
  submitTurn: (type, cards) => turnActions.submitTurn.call(get(), type, cards),

  // 订阅操作 - 使用 .call() 绑定 this 上下文
  subscribeGame: (roomId, options) => subscriptionActions.subscribeGame.call(get(), roomId, options),

  // 进贡操作 - 使用 .call() 绑定 this 上下文
  calculateTribute: () => tributeActions.calculateTribute.call(get()),
  submitTribute: (card) => tributeActions.submitTribute.call(get(), card),
  submitReturn: (card) => tributeActions.submitReturn.call(get(), card),

  // 暂停操作 - 使用 .call() 绑定 this 上下文
  pauseGame: (reason?) => pauseActions.pauseGame.call(get(), reason),
  resumeGame: () => pauseActions.resumeGame.call(get()),
}))

// 导出类型
export type { Card, GameState, initialGameState }
export type { TurnRow, LastAction, TurnPayload, GameRow } from './types'
