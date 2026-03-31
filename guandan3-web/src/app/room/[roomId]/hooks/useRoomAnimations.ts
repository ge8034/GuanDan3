/**
 * 房间页面动画状态 Hook
 *
 * 管理所有游戏动画的状态和触发逻辑
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import { useGameStore } from '@/lib/store/game'
import type { Card } from '@/lib/store/game'
import { logger } from '@/lib/utils/logger'

interface RoomAnimationsOptions {
  gameStatus: string
  lastAction: { type?: string; cards?: unknown[]; seatNo?: number } | null
  currentSeat: number
  rankings: number[]
  mySeat: number
}

export function useRoomAnimations(options: RoomAnimationsOptions) {
  const { gameStatus, lastAction, currentSeat, rankings, mySeat } = options

  // 动画状态
  const [showDealAnimation, setShowDealAnimation] = useState(false)
  const [showPlayAnimation, setShowPlayAnimation] = useState(false)
  const [showVictoryEffect, setShowVictoryEffect] = useState(false)
  const [showComboEffect, setShowComboEffect] = useState(false)

  // 动画数据
  const [playAnimationCards, setPlayAnimationCards] = useState<Card[]>([])
  const [playAnimationFromSeat, setPlayAnimationFromSeat] = useState(0)
  const [playAnimationToSeat, setPlayAnimationToSeat] = useState(0)
  const [victoryType, setVictoryType] = useState<'victory' | 'defeat'>('victory')
  const [comboCount, setComboCount] = useState(0)

  // Refs
  const previousStatusRef = useRef<string | null>(null)
  const lastPlaySeatRef = useRef<number | null>(null)

  // 发牌动画：deal -> playing
  useEffect(() => {
    if (previousStatusRef.current === 'deal' && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        setShowDealAnimation(true)
      }, 0)
      return () => clearTimeout(timer)
    }
    previousStatusRef.current = gameStatus
  }, [gameStatus])

  // 出牌动画
  useEffect(() => {
    if (
      lastAction?.type === 'play' &&
      lastAction.cards &&
      lastAction.cards.length > 0
    ) {
      const timer = setTimeout(() => {
        setPlayAnimationCards(lastAction.cards as Card[])
        setPlayAnimationFromSeat(lastAction.seatNo ?? 0)
        setPlayAnimationToSeat(currentSeat)
        setShowPlayAnimation(true)

        // 连续出牌检测
        if (lastAction.seatNo === lastPlaySeatRef.current) {
          setComboCount((prev) => prev + 1)
          setShowComboEffect(true)
        } else {
          setComboCount(1)
          lastPlaySeatRef.current = lastAction.seatNo ?? null
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [lastAction, currentSeat])

  // 胜利动画
  useEffect(() => {
    if (gameStatus === 'finished' && rankings.length > 0) {
      const myRanking = rankings.indexOf(mySeat)
      if (myRanking !== -1) {
        const timer = setTimeout(() => {
          setVictoryType(myRanking === 0 || myRanking === 1 ? 'victory' : 'defeat')
          setShowVictoryEffect(true)
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [gameStatus, rankings, mySeat])

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
    // 状态
    showDealAnimation,
    showPlayAnimation,
    showVictoryEffect,
    showComboEffect,

    // 数据
    playAnimationCards,
    playAnimationFromSeat,
    playAnimationToSeat,
    victoryType,
    comboCount,

    // 回调
    handleDealAnimationComplete,
    handlePlayAnimationComplete,
    handleVictoryEffectComplete,
    handleComboEffectComplete,
  }
}
