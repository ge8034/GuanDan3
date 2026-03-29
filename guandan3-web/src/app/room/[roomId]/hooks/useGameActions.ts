import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import type { Card } from '@/lib/store/game'

/**
 * 游戏动作处理 Hook
 *
 * 封装开始游戏、出牌、不出牌等游戏操作
 */
export function useGameActions(roomId: string) {
  const router = useRouter()
  const { toastView, showToast } = useToast()
  const { currentRoom, members } = useRoomStore()
  const {
    submitTurn,
    pauseGame,
    resumeGame,
    startGame
  } = useGameStore()

  // 开始游戏
  const handleStart = useCallback(async () => {
    try {
      await startGame(roomId)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      showToast({ message: `开始游戏失败: ${message}`, kind: 'error' })
    }
  }, [roomId, startGame, showToast])

  // 添加 AI
  const handleAddAI = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    const { addAI } = await import('@/lib/store/room')
    try {
      await addAI(roomId, difficulty)
    } catch (e: unknown) {
      showToast({ message: mapSupabaseErrorToMessage(e, '添加机器人失败'), kind: 'error' })
    }
  }, [roomId, showToast])

  // 加入房间（覆盖层按钮）
  const handleOverlayJoin = useCallback(async () => {
    const { joinRoom } = await import('@/lib/store/room')
    try {
      await joinRoom(roomId).then(() => {
        // 刷新页面以重新初始化
        router.refresh()
      })
    } catch (e: unknown) {
      showToast({ message: mapSupabaseErrorToMessage(e, '加入房间失败'), kind: 'error' })
    }
  }, [roomId, router, showToast])

  // 出牌
  const handlePlay = useCallback(async (selectedIds: number[]) => {
    const { myHand } = useGameStore.getState()
    const selectedCards = myHand.filter(c => selectedIds.includes(c.id))

    if (selectedCards.length === 0) {
      showToast({ message: '请选择要出的牌', kind: 'warning' })
      return
    }

    try {
      await submitTurn('play', selectedCards)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      showToast({ message: `出牌失败: ${message}`, kind: 'error' })
    }
  }, [submitTurn, showToast])

  // 不出
  const handlePass = useCallback(async () => {
    try {
      await submitTurn('pass')
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      showToast({ message: `不出牌失败: ${message}`, kind: 'error' })
    }
  }, [submitTurn, showToast])

  // 暂停游戏
  const handlePause = useCallback(async () => {
    try {
      await pauseGame('玩家主动暂停')
      showToast({ message: '游戏已暂停', kind: 'success' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      showToast({ message: `暂停失败: ${message}`, kind: 'error' })
    }
  }, [pauseGame, showToast])

  // 恢复游戏
  const handleResume = useCallback(async () => {
    try {
      await resumeGame()
      showToast({ message: '游戏已恢复', kind: 'success' })
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '未知错误'
      showToast({ message: `恢复失败: ${message}`, kind: 'error' })
    }
  }, [resumeGame, showToast])

  // 离开房间
  const handleLeave = useCallback(async () => {
    const { leaveRoom } = await import('@/lib/store/room')
    try {
      await leaveRoom(roomId)
      router.push('/lobby')
    } catch (e: unknown) {
      showToast({ message: mapSupabaseErrorToMessage(e, '离开房间失败'), kind: 'error' })
    }
  }, [roomId, router, showToast])

  return {
    handleStart,
    handleAddAI,
    handleOverlayJoin,
    handlePlay,
    handlePass,
    handlePause,
    handleResume,
    handleLeave,
    toastView,
  }
}
