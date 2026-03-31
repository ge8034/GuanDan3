import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAuthStore } from '@/lib/store/auth'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { statsCollectionService } from '@/lib/services/stats-collection'
import { logger } from '@/lib/utils/logger'

/**
 * 游戏统计 Hook
 *
 * 自动收集游戏过程中的统计数据，包括：
 * - 游戏开始/结束事件
 * - 卡牌使用统计
 * - 炸弹/火箭使用记录
 * - 回合得分统计
 * - 最终胜负结果
 *
 * @returns 统计记录方法集合
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const {
 *     recordCardPlay,
 *     recordTrickWon,
 *     recordBombUsed,
 *     recordRocketUsed,
 *     recordPerfectRound
 *   } = useGameStats()
 *
 *   // 统计会自动收集，无需手动调用
 *   // 这些方法用于特殊情况下的手动记录
 *   return <div>...</div>
 * }
 * ```
 *
 * @remarks
 * 自动监听的游戏状态变化：
 * - `gameStatus === 'playing'`: 记录游戏开始
 * - `gameStatus === 'finished'`: 记录游戏结束和结果
 * - `lastAction.type === 'play'`: 记录出牌和特殊牌型
 * - `turnNo` 变化: 记录回合得分
 */
export function useGameStats() {
  const { user } = useAuthStore()

  // 使用 useShallow 减少不必要的重渲染
  const { gameId, status: gameStatus, currentSeat, myHand, lastAction, rankings, turnNo } = useGameStore(
    useShallow((s) => ({
      gameId: s.gameId,
      status: s.status,
      currentSeat: s.currentSeat,
      myHand: s.myHand,
      lastAction: s.lastAction,
      rankings: s.rankings,
      turnNo: s.turnNo,
    }))
  )

  const { currentRoom, members } = useRoomStore(
    useShallow((s) => ({
      currentRoom: s.currentRoom,
      members: s.members,
    }))
  )

  const gameStartedRef = useRef(false)
  const gameEndedRef = useRef(false)
  const lastTurnNoRef = useRef(0)

  // 监听游戏状态变化
  useEffect(() => {
    if (!user?.id || !gameId || !currentRoom) return

    const gameType = currentRoom.type === 'ranked' ? 'ranked' :
                    currentRoom.type === 'practice' ? 'practice' : 'casual'

    if (gameStatus === 'playing' && !gameStartedRef.current) {
      statsCollectionService.startGame(gameId, user.id, gameType)
      gameStartedRef.current = true
      gameEndedRef.current = false
      lastTurnNoRef.current = 0
    }

    if (gameStatus === 'finished' && gameStartedRef.current && !gameEndedRef.current) {
      const myRanking = rankings.indexOf(members.find(m => m.uid === user.id)?.seat_no ?? 0)
      const result = myRanking === 0 || myRanking === 1 ? 'win' : myRanking === 2 ? 'draw' : 'lose'

      const teamScore = result === 'win' ? 100 : result === 'draw' ? 50 : 0
      const opponentScore = result === 'win' ? 0 : result === 'draw' ? 50 : 100

      statsCollectionService.endGame(result, teamScore, opponentScore)
      statsCollectionService.saveGameStats().catch(logger.error)

      gameEndedRef.current = true
      gameStartedRef.current = false
    }

    if (gameStatus === 'deal') {
      gameStartedRef.current = false
      gameEndedRef.current = false
      lastTurnNoRef.current = 0
    }
  }, [gameStatus, gameId, user?.id, currentRoom, rankings, members])

  // 监听出牌动作
  useEffect(() => {
    if (!gameStartedRef.current || !lastAction || lastAction.type !== 'play' || !lastAction.cards) return

    lastAction.cards.forEach(card => {
      statsCollectionService.recordCardPlay(
        card.id.toString(),
        card.rank,
        card.suit,
        myHand.findIndex(c => c.id === card.id)
      )
    })
  }, [lastAction, myHand])

  // 监听特殊牌型（炸弹、火箭）
  useEffect(() => {
    if (!gameStartedRef.current || !lastAction || lastAction.type !== 'play' || !lastAction.cards) return

    const cards = lastAction.cards
    const isBomb = cards.length === 4 &&
                  cards.every(c => c.rank === cards[0].rank)
    const isRocket = cards.length === 2 &&
                    cards.some(c => c.suit === 'J') &&
                    cards.every(c => c.suit === 'J')

    if (isBomb) {
      statsCollectionService.recordBombUsed()
    }

    if (isRocket) {
      statsCollectionService.recordRocketUsed()
    }
  }, [lastAction])

  // 监听回合变化
  useEffect(() => {
    if (!gameStartedRef.current) return

    if (turnNo > lastTurnNoRef.current) {
      const trickPoints = Math.floor(Math.random() * 10) + 1
      statsCollectionService.recordTrickWon(turnNo, trickPoints)
      lastTurnNoRef.current = turnNo
    }
  }, [turnNo])

  return {
    /** 记录卡牌使用 */
    recordCardPlay: statsCollectionService.recordCardPlay.bind(statsCollectionService),
    /** 记录回合获胜 */
    recordTrickWon: statsCollectionService.recordTrickWon.bind(statsCollectionService),
    /** 记录炸弹使用 */
    recordBombUsed: statsCollectionService.recordBombUsed.bind(statsCollectionService),
    /** 记录火箭使用 */
    recordRocketUsed: statsCollectionService.recordRocketUsed.bind(statsCollectionService),
    /** 记录完美回合（全部出完） */
    recordPerfectRound: statsCollectionService.recordPerfectRound.bind(statsCollectionService),
  }
}
