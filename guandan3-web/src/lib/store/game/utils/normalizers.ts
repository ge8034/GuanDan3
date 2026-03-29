import type { TurnRow, LastAction } from '../types'

/**
 * 规范化最近回合记录
 * 去重并按回合号降序排序，只保留最近4条
 */
export function normalizeRecentTurns(turns: TurnRow[]): TurnRow[] {
  const dedup = new Map<number, TurnRow>()
  for (const t of turns) {
    if (typeof t.turn_no !== 'number') continue
    if (!dedup.has(t.turn_no)) dedup.set(t.turn_no, t)
  }
  return Array.from(dedup.values()).sort((a, b) => b.turn_no - a.turn_no).slice(0, 4)
}

/**
 * 从最近回合记录计算最后一个出牌动作
 */
export function computeLastActionFromRecentTurns(recentTurns: TurnRow[], currentSeat: number): LastAction {
  let consecutivePasses = 0
  for (const t of recentTurns) {
    if (t.payload?.type === 'pass') {
      consecutivePasses++
      continue
    }
    if (t.payload?.type === 'play') {
      if (consecutivePasses >= 3 || t.seat_no === currentSeat) return null
      return { type: 'play', cards: t.payload.cards, seatNo: t.seat_no }
    }
  }
  return null
}
