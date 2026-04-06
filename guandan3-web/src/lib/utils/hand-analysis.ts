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

export function countRockets(hand: number[]): number {
  if (!hand || hand.length === 0) return 0

  let rocketCount = 0
  const redJokers = hand.filter(c => c % 100 === 16).length
  const blackJokers = hand.filter(c => c % 100 === 17).length

  rocketCount = Math.min(redJokers, blackJokers)

  return rocketCount
}

export function getHighCards(hand: number[]): number[] {
  if (!hand || hand.length === 0) return []

  return hand
    .filter(card => {
      const value = card % 100
      return value >= 14 || value === 16 || value === 17
    })
    .sort((a, b) => (b % 100) - (a % 100))
}

export function getLowCards(hand: number[]): number[] {
  if (!hand || hand.length === 0) return []

  return hand
    .filter(card => {
      const value = card % 100
      return value <= 9 && value !== 16 && value !== 17
    })
    .sort((a, b) => (a % 100) - (b % 100))
}

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
