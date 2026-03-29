import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { devError } from '@/lib/utils/devLog'

/**
 * 自动开始游戏 Hook
 *
 * 在练习模式下，当房间准备好时自动开始游戏
 */
export function useAutoStart(
  roomId: string,
  currentRoom: ReturnType<typeof useRoomStore>['currentRoom'] | null,
  gameStatus: ReturnType<typeof useGameStore>['status'],
  roomLoaded: boolean,
  isOwner: boolean
) {
  const autoStartStartedRef = useRef(false)
  const startGameRef = useRef(useGameStore.getState().startGame)
  startGameRef.current = useGameStore.getState().startGame

  useEffect(() => {
    // 练习模式自动开始游戏
    const shouldAutoStart =
      currentRoom?.mode === 'pve1v3' && // 练习模式
      gameStatus === 'deal' && // 游戏未开始
      roomLoaded && // 房间已加载
      isOwner && // 是房主
      !autoStartStartedRef.current && // 未尝试过自动开始
      !useGameStore.getState().gameId // 没有游戏ID

    if (shouldAutoStart) {
      autoStartStartedRef.current = true
      const timer = setTimeout(async () => {
        try {
          await startGameRef.current(roomId)
        } catch (e) {
          devError('[AutoStart] Failed to start practice game:', e)
        }
      }, 1000) // 延迟1秒确保房间状态已同步
      return () => clearTimeout(timer)
    }
  }, [currentRoom?.mode, gameStatus, roomLoaded, isOwner, roomId])
}
