import { Card } from '@/lib/store/game'
import { analyzeMove, canBeat } from '@/lib/game/rules'

/**
 * 获取卡牌类型
 *
 * 根据卡牌 ID 数组分析出牌类型（如单张、对子、炸弹等）
 *
 * @param cards - 卡牌 ID 数组，每个 ID 为 3 位数字：百位表示花色，个位十位表示点数
 * @returns 出牌类型字符串，如 'single', 'pair', 'bomb' 等；无效牌型返回 null
 *
 * @example
 * ```ts
 * getCardType([101, 201]) // 返回 'pair' (对子)
 * getCardType([101, 102, 103, 104]) // 返回 'straight' (顺子)
 * getCardType([115, 215, 315, 415]) // 返回 'bomb' (炸弹)
 * ```
 */
export function getCardType(cards: number[]): string | null {
  if (!cards || cards.length === 0) return null

  const rankMap: Record<number, string> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'S', 17: 'B'
  }

  const cardObjects: Card[] = cards.map(id => ({
    id,
    suit: ['S', 'H', 'C', 'D'][Math.floor(id / 100)] as any,
    val: id % 100,
    rank: rankMap[id % 100] || '2'
  }))

  const move = analyzeMove(cardObjects, 2)
  return move?.type || null
}

/**
 * 获取卡牌类型的强度值
 *
 * 返回牌型的强度数值，用于比较不同牌型的大小
 *
 * @param type - 牌型字符串，如 'single', 'pair', 'bomb' 等
 * @returns 牌型强度值，范围 0-10。未知牌型返回 0
 *
 * @example
 * ```ts
 * getCardTypeStrength('single') // 返回 1
 * getCardTypeStrength('bomb') // 返回 10
 * getCardTypeStrength('fullhouse') // 返回 8
 * ```
 */
export function getCardTypeStrength(type: string): number {
  const strengthMap: Record<string, number> = {
    'single': 1,
    'pair': 2,
    'triple': 3,
    'straight': 4,
    'sequencePairs': 5,
    'sequenceTriples': 6,
    'fullhouse': 8,
    'bomb': 10,
    'pass': 0
  }
  return strengthMap[type] || 0
}

/**
 * 检查一组牌是否可以压过另一组牌
 *
 * @param cards - 要打出的牌
 * @param targetCards - 目标牌（上家打出的牌）
 * @returns 是否可以压过
 *
 * @example
 * ```ts
 * canBeat([{id: 201, val: 2, rank: '2', suit: 'H'}], [{id: 101, val: 1, rank: 'A', suit: 'S'}])
 * // 返回 true（2 可以压 A）
 * ```
 */
export { canBeat }
