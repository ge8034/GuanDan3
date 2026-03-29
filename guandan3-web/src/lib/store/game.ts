/**
 * 游戏状态管理 - 统一导出入口
 *
 * 向后兼容：从 '@/lib/store/game' 导入所有类型和功能
 */

// 导出 Store
export { useGameStore } from './game/store'

// 导出类型
export type { Card, GameState } from './game/types'
export type { TurnRow, LastAction, TurnPayload, GameRow } from './game/types'
