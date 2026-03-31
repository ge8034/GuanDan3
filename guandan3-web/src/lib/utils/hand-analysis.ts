/**
 * 分析手牌强度
 *
 * 综合评估手牌的整体强度，考虑大牌、炸弹、顺子潜力等因素。
 * 返回 0-1 之间的分数值。
 *
 * @param hand - 手牌 ID 数组
 * @returns 手牌强度分数 (0-1)
 *
 * @example
 * ```ts
 * analyzeHandStrength([101, 201, 301, 401]) // 弱牌，约 0.1
 * analyzeHandStrength([114, 114, 114, 114]) // 炸弹，约 0.25
 * analyzeHandStrength([114, 113, 112, 111, 110]) // 顺子潜力，约 0.3
 * ```
 *
 * @remarks
 * 评分因素：
 * - 大牌 (A 以上): +0.03-0.05
 * - 三张: +0.08
 * - 炸弹: +0.15
 * - 花色集中: +0.1
 * - 顺子潜力: +0.12
 */
export function analyzeHandStrength(hand: number[]): number {
  if (!hand || hand.length === 0) return 0

  let strength = 0
  const valueCount = new Map<number, number>()
  const suitCount = new Map<number, number>()

  for (const card of hand) {
    const value = card % 100
    const suit = Math.floor(card / 100)

    valueCount.set(value, (valueCount.get(value) || 0) + 1)
    suitCount.set(suit, (suitCount.get(suit) || 0) + 1)

    if (value >= 14) {
      strength += 0.05
    } else if (value >= 10) {
      strength += 0.03
    }
  }

  Array.from(valueCount.entries()).forEach(([value, count]) => {
    if (count === 4) {
      strength += 0.15
    } else if (count === 3) {
      strength += 0.08
    } else if (count === 2) {
      strength += 0.04
    }
  })

  const maxSuitCount = Math.max(...Array.from(suitCount.values()))
  if (maxSuitCount >= 5) {
    strength += 0.1
  }

  const sortedValues = Array.from(valueCount.keys()).sort((a, b) => a - b)
  let consecutiveCount = 1
  let maxConsecutive = 1

  for (let i = 1; i < sortedValues.length; i++) {
    if (sortedValues[i] === sortedValues[i - 1] + 1) {
      consecutiveCount++
      maxConsecutive = Math.max(maxConsecutive, consecutiveCount)
    } else {
      consecutiveCount = 1
    }
  }

  if (maxConsecutive >= 5) {
    strength += 0.12
  }

  strength = Math.min(1.0, strength)

  return strength
}

/**
 * 统计手牌中的炸弹数量
 *
 * @param hand - 手牌 ID 数组
 * @returns 炸弹数量
 *
 * @example
 * ```ts
 * countBombs([114, 214, 314, 414]) // 返回 1 (4张A)
 * countBombs([114, 214, 314, 414, 115, 215, 315, 415]) // 返回 2
 * ```
 */
export function countBombs(hand: number[]): number {
  if (!hand || hand.length === 0) return 0

  const valueCount = new Map<number, number>()
  let bombCount = 0

  for (const card of hand) {
    const value = card % 100
    valueCount.set(value, (valueCount.get(value) || 0) + 1)
  }

  Array.from(valueCount.values()).forEach(count => {
    if (count === 4) {
      bombCount++
    }
  })

  return bombCount
}

/**
 * 统计手牌中的火箭数量
 *
 * 火箭 = 红王 + 黑王
 *
 * @param hand - 手牌 ID 数组
 * @returns 火箭数量
 *
 * @example
 * ```ts
 * countRockets([116, 117]) // 返回 1 (一对王)
 * countRockets([116, 117, 216, 217]) // 返回 2
 * countRockets([116, 116, 117]) // 返回 1 (不完整)
 * ```
 */
export function countRockets(hand: number[]): number {
  if (!hand || hand.length === 0) return 0

  let rocketCount = 0
  const redJokers = hand.filter(c => c % 100 === 16).length
  const blackJokers = hand.filter(c => c % 100 === 17).length

  rocketCount = Math.min(redJokers, blackJokers)

  return rocketCount
}

/**
 * 获取手牌中的大牌
 *
 * 大牌定义为：A (14)、红王 (16)、黑王 (17)
 *
 * @param hand - 手牌 ID 数组
 * @returns 大牌 ID 数组，按点数降序排列
 *
 * @example
 * ```ts
 * getHighCards([101, 114, 116, 203, 117])
 * // 返回 [117, 116, 114] (大王、小王、A)
 * ```
 */
export function getHighCards(hand: number[]): number[] {
  if (!hand || hand.length === 0) return []

  return hand
    .filter(card => {
      const value = card % 100
      return value >= 14 || value === 16 || value === 17
    })
    .sort((a, b) => (b % 100) - (a % 100))
}

/**
 * 获取手牌中的小牌
 *
 * 小牌定义为：9 及以下的非王牌
 *
 * @param hand - 手牌 ID 数组
 * @returns 小牌 ID 数组，按点数升序排列
 *
 * @example
 * ```ts
 * getLowCards([101, 205, 309, 412, 116])
 * // 返回 [101, 205, 309, 412] (剔除大王后的2-9)
 * ```
 */
export function getLowCards(hand: number[]): number[] {
  if (!hand || hand.length === 0) return []

  return hand
    .filter(card => {
      const value = card % 100
      return value <= 9 && value !== 16 && value !== 17
    })
    .sort((a, b) => (a % 100) - (b % 100))
}

/**
 * 分析手牌打法风格
 *
 * 根据手牌强度、炸弹数量、大牌分布等因素判断打法风格。
 *
 * @param hand - 手牌 ID 数组
 * @returns 打法风格类型
 *
 * @example
 * ```ts
 * analyzePlayStyle([114, 114, 114, 114, 116, 117]) // 'aggressive' (多炸弹+火箭)
 * analyzePlayStyle([201, 202, 203, 204, 205, 206, 207]) // 'conservative' (无大牌)
 * analyzePlayStyle([114, 113, 112, 111, 210, 209, 208]) // 'balanced'
 * ```
 *
 * @remarks
 * 风格判断逻辑：
 * - aggressive: 强手牌 + 多炸弹 + 多火箭
 * - conservative: 弱牌 + 多小牌
 * - balanced: 其他情况
 */
export function analyzePlayStyle(hand: number[]): 'aggressive' | 'conservative' | 'balanced' {
  if (!hand || hand.length === 0) return 'balanced'

  const strength = analyzeHandStrength(hand)
  const bombCount = countBombs(hand)
  const rocketCount = countRockets(hand)
  const highCards = getHighCards(hand)

  const aggressiveScore = strength * 0.5 + bombCount * 0.3 + rocketCount * 0.2
  const conservativeScore = (1 - strength) * 0.5 + (hand.length - highCards.length) / hand.length * 0.5

  if (aggressiveScore > 0.6) {
    return 'aggressive'
  } else if (conservativeScore > 0.6) {
    return 'conservative'
  } else {
    return 'balanced'
  }
}
