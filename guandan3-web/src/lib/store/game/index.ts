/**
 * 游戏状态管理模块
 *
 * 本模块导出游戏状态管理的所有类型和功能
 */

// 导出 Store
export { useGameStore } from './store'

// 导出类型
export type { Card, GameState } from './types'
export type { TurnRow, LastAction, TurnPayload, GameRow } from './types'
export type { initialGameState } from './types'
