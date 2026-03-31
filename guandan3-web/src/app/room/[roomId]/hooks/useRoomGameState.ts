/**
 * 房间页面游戏状态 Hook
 *
 * 集中管理所有游戏相关的 store 状态和派生状态
 * 使用 useShallow 减少不必要的重渲染
 */

import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { logger } from '@/lib/utils/logger'

interface RoomGameStateOptions {
  roomId: string
  onAutoStart?: () => void
}

/**
 * 使用 useShallow 优化性能
 * 只有当返回的状态值真正发生变化时才会触发重渲染
 */
export function useRoomGameState(options: RoomGameStateOptions) {
  const { roomId } = options

  // Room Store - 使用 shallow 比较减少重渲染
  const {
    currentRoom,
    members,
    joinRoom,
    addAI,
    toggleReady,
    leaveRoom,
    heartbeatRoomMember,
  } = useRoomStore(
    useShallow((s) => ({
      currentRoom: s.currentRoom,
      members: s.members,
      joinRoom: s.joinRoom,
      addAI: s.addAI,
      toggleReady: s.toggleReady,
      leaveRoom: s.leaveRoom,
      heartbeatRoomMember: s.heartbeatRoomMember,
    }))
  )

  // Game Store - 使用 shallow 比较减少重渲染
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
  } = useGameStore(
    useShallow((s) => ({
      gameId: s.gameId,
      status: s.status,
      turnNo: s.turnNo,
      currentSeat: s.currentSeat,
      levelRank: s.levelRank,
      myHand: s.myHand,
      lastAction: s.lastAction,
      counts: s.counts,
      rankings: s.rankings,
      fetchLastTrickPlay: s.fetchLastTrickPlay,
      fetchGame: s.fetchGame,
      pauseGame: s.pauseGame,
      resumeGame: s.resumeGame,
      pausedBy: s.pausedBy,
      pausedAt: s.pausedAt,
      pauseReason: s.pauseReason,
    }))
  )

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
