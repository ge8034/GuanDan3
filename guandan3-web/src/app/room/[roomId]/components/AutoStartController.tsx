import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'

/**
 * 自动开始控制器组件
 *
 * 在练习模式下自动开始游戏
 */
export function AutoStartController({
  roomId,
  currentRoom,
  gameStatus,
  roomLoaded,
  isOwner,
}: {
  roomId: string
  currentRoom: ReturnType<typeof useRoomStore>['currentRoom'] | null
  gameStatus: 'deal' | 'playing' | 'paused' | 'finished'
  roomLoaded: boolean
  isOwner: boolean
}) {
  // 组件仅用于触发自动开始逻辑
  // 实际逻辑在 useAutoStart hook 中处理

  return null
}
