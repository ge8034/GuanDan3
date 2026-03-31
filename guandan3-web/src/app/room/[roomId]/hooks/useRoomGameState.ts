/**
 * 房间页面游戏状态 Hook
 *
 * 集中管理所有游戏相关的 store 状态和派生状态
 */

import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { logger } from '@/lib/utils/logger'

interface RoomGameStateOptions {
  roomId: string
  onAutoStart?: () => void
}

export function useRoomGameState(options: RoomGameStateOptions) {
  const { roomId } = options

  // Room Store
  const {
    currentRoom,
    members,
    joinRoom,
    addAI,
    toggleReady,
    leaveRoom,
    heartbeatRoomMember,
  } = useRoomStore()

  // Game Store - 解构需要的方法
  const {
    gameId,
    status: gameStatus,
    turnNo,
    currentSeat,
    levelRank,
    myHand,
    lastAction,
    counts,
    rankings,
    fetchLastTrickPlay,
    fetchGame,
    pauseGame,
    resumeGame,
    pausedBy,
    pausedAt,
    pauseReason,
  } = useGameStore()

  // 使用 ref 存储 startGame 以避免依赖循环
  const startGameRef = useRef(useGameStore.getState().startGame)
  startGameRef.current = useGameStore.getState().startGame

  // 监听 currentRoom 变化
  useEffect(() => {
    logger.debug('[useRoomGameState] currentRoom changed:', currentRoom)
  }, [currentRoom])

  return {
    // Room Store
    currentRoom,
    members,
    joinRoom,
    addAI,
    toggleReady,
    leaveRoom,
    heartbeatRoomMember,

    // Game Store
    gameId,
    gameStatus,
    turnNo,
    currentSeat,
    levelRank,
    myHand,
    lastAction,
    counts,
    rankings,
    fetchLastTrickPlay,
    fetchGame,
    pauseGame,
    resumeGame,
    pausedBy,
    pausedAt,
    pauseReason,

    // Refs
    startGameRef,
    roomId,
  }
}
