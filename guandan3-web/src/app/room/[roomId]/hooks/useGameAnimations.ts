import { useState, useRef, useCallback, useEffect } from 'react'
import type { Card, LastAction } from '@/lib/store/game'

/**
 * 游戏动画状态管理 Hook
 *
 * 处理发牌、出牌、胜利等动画效果
 */
export function useGameAnimations(
  gameStatus: 'deal' | 'playing' | 'paused' | 'finished',
  lastAction: LastAction,
  currentSeat: number,
  mySeat: number | undefined,
  counts: number[]
) {
  const [showDealAnimation, setShowDealAnimation] = useState(false)
  const [showPlayAnimation, setShowPlayAnimation] = useState(false)
  const [playAnimationCards, setPlayAnimationCards] = useState<Card[]>([])
  const [playAnimationFromSeat, setPlayAnimationFromSeat] = useState(0)
  const [playAnimationToSeat, setPlayAnimationToSeat] = useState(0)
  const [showVictoryEffect, setShowVictoryEffect] = useState(false)
  const [victoryType, setVictoryType] = useState<'victory' | 'defeat'>('victory')
  const [showComboEffect, setShowComboEffect] = useState(false)
  const [comboCount, setComboCount] = useState(0)

  const previousStatusRef = useRef<string | null>(null)
  const lastPlaySeatRef = useRef<number | null>(null)

  // 发牌动画
  useEffect(() => {
    if (gameStatus === 'playing' && previousStatusRef.current === 'deal') {
      setShowDealAnimation(true)
    }
    previousStatusRef.current = gameStatus
  }, [gameStatus])

  // 出牌动画
  useEffect(() => {
    if (lastAction && lastAction.type === 'play' && lastAction.seatNo !== mySeat) {
      const previousPlaySeat = lastPlaySeatRef.current

      // 检测连续出牌（连击）
      if (previousPlaySeat === lastAction.seatNo) {
        setComboCount(prev => prev + 1)
        setShowComboEffect(true)
      } else {
        setComboCount(1)
      }

      lastPlaySeatRef.current = lastAction.seatNo
      setPlayAnimationCards(lastAction.cards || [])
      setPlayAnimationFromSeat(lastAction.seatNo)
      setPlayAnimationToSeat(currentSeat)
      setShowPlayAnimation(true)
    }
  }, [lastAction, currentSeat, mySeat])

  // 胜利/失败效果
  useEffect(() => {
    if (gameStatus === 'finished') {
      // 检查自己是否获胜
      const myRanking = counts.findIndex(c => c === 0)
      if (myRanking >= 0 && myRanking <= 1) {
        setVictoryType('victory')
        setShowVictoryEffect(true)
      } else if (myRanking >= 2 && myRanking <= 3) {
        setVictoryType('defeat')
        setShowVictoryEffect(true)
      }
    }
  }, [gameStatus, counts])

  // 动画完成回调
  const handleDealAnimationComplete = useCallback(() => {
    setShowDealAnimation(false)
  }, [])

  const handlePlayAnimationComplete = useCallback(() => {
    setShowPlayAnimation(false)
  }, [])

  const handleVictoryEffectComplete = useCallback(() => {
    setShowVictoryEffect(false)
  }, [])

  const handleComboEffectComplete = useCallback(() => {
    setShowComboEffect(false)
  }, [])

  return {
    // 动画状态
    showDealAnimation,
    showPlayAnimation,
    playAnimationCards,
    playAnimationFromSeat,
    playAnimationToSeat,
    showVictoryEffect,
    victoryType,
    showComboEffect,
    comboCount,
    // 动画控制
    handleDealAnimationComplete,
    handlePlayAnimationComplete,
    handleVictoryEffectComplete,
    handleComboEffectComplete,
  }
}
