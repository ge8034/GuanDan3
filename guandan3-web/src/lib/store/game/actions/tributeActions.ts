import { supabase } from '@/lib/supabase/client'
import { devError } from '@/lib/utils/devLog'
import type { GameState, Card } from '../types'

/**
 * 计算进贡
 */
export async function calculateTribute(this: GameState): Promise<void> {
  const state = this
  if (!state.gameId || state.rankings.length === 0) return

  const { rankings, levelRank } = state

  // 确定获胜和失败的队伍
  const winningTeam = rankings[0] % 2
  const losingTeam = 1 - winningTeam

  // 获取所有手牌
  const winnerHands: Record<number, Card[]> = {}
  const loserHands: Record<number, Card[]> = {}

  for (let seat = 0; seat < 4; seat++) {
    const team = seat % 2
    const hand = await state.getAIHand(seat)

    if (team === winningTeam) {
      winnerHands[seat] = hand
    } else {
      loserHands[seat] = hand
    }
  }

  // 使用进贡规则计算
  const { calculateTeamTribute } = await import('@/lib/game/tributeRules')
  const tributeState = calculateTeamTribute(winningTeam, losingTeam, winnerHands, loserHands, levelRank)

  state.setGame({
    tributePhase: true,
    tributeFrom: tributeState.tributeFrom,
    tributeTo: tributeState.tributeTo,
    resistTribute: tributeState.resistTribute,
    tributeCards: {},
    returnCards: {}
  })
}

/**
 * 提交进贡
 */
export async function submitTribute(this: GameState, tributeCard: Card): Promise<void> {
  const state = this
  if (!state.gameId) return

  const { error } = await supabase.rpc('submit_tribute', {
    p_game_id: state.gameId,
    p_tribute_card: tributeCard
  })

  if (error) {
    devError('Submit tribute failed:', error)
    throw error
  }

  // 更新本地状态
  const newHand = state.myHand.filter(c => c.id !== tributeCard.id)
  state.updateHand(newHand)
}

/**
 * 提交还牌
 */
export async function submitReturn(this: GameState, returnCard: Card): Promise<void> {
  const state = this
  if (!state.gameId) return

  const { error } = await supabase.rpc('submit_return', {
    p_game_id: state.gameId,
    p_return_card: returnCard
  })

  if (error) {
    devError('Submit return failed:', error)
    throw error
  }

  // 更新本地状态
  const newHand = [...state.myHand, returnCard]
  state.updateHand(newHand)
}
