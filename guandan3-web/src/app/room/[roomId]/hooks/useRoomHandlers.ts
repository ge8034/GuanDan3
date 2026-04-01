/**
 * 房间页面事件处理 Hook
 *
 * 管理所有用户交互事件处理逻辑
 */

import { useState, useCallback, useEffect, MutableRefObject, useRef } from 'react'
import type { Card } from '@/lib/store/game'
import { useGameStore } from '@/lib/store/game'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { analyzeMove, canBeat } from '@/lib/game/rules'
import { logger } from '@/lib/utils/logger'

interface ToastOptions {
  message: string
  kind: 'success' | 'error' | 'info' | 'warning'
  timeoutMs?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface RoomHandlersOptions {
  roomId: string
  // Store actions
  joinRoom: (roomId: string, seatNo?: number) => Promise<boolean>
  heartbeatRoomMember: (roomId: string) => Promise<void>
  fetchLastTrickPlay: () => Promise<unknown>
  pauseGame: (reason: string) => Promise<void>
  resumeGame: () => Promise<void>

  // Store state
  myHand: Card[]
  levelRank: number
  lastAction: { type?: string; cards?: unknown[]; seatNo?: number } | null

  // Refs
  startGameRef: MutableRefObject<(roomId: string) => Promise<void>>

  // UI callbacks - 使用更灵活的类型以适配不同的 showToast 签名
  showToast: (options: { message: string; kind: string; timeoutMs?: number; action?: { label: string; onClick: () => void } }) => void
  playSound: Function

  // Derived state
  realtimeHealthy: boolean
}

interface RoomHandlersResult {
  // Local state
  selectedCardIds: number[]
  setSelectedCardIds: React.Dispatch<React.SetStateAction<number[]>>

  // Event handlers
  handleStart: () => Promise<void>
  copyRoomLink: () => Promise<void>
  handleOverlayJoin: () => void
  handleCardClick: (id: number) => void
  handlePlay: () => Promise<void>
  handlePass: () => Promise<void>
  handlePause: () => Promise<void>
  handleResume: () => Promise<void>
}

export function useRoomHandlers(
  options: RoomHandlersOptions
): RoomHandlersResult {
  const {
    roomId,
    joinRoom,
    heartbeatRoomMember,
    fetchLastTrickPlay,
    pauseGame,
    resumeGame,
    myHand,
    levelRank,
    lastAction,
    startGameRef,
    showToast,
    playSound,
    realtimeHealthy,
  } = options

  // 本地状态：选中的卡牌 ID
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])

  // 保存上一次的手牌 ID 集合，用于检测手牌变化
  const prevHandIdsRef = useRef<Set<number>>(new Set())

  // 当手牌刷新时，清除不再存在的选中卡牌
  // 修复：Realtime 更新会触发 fetchGame 刷新手牌，但 UI 的选中状态未同步
  useEffect(() => {
    const currentHandIds = new Set(myHand.map((c) => c.id))
    const prevHandIds = prevHandIdsRef.current

    // 检测手牌是否发生变化（新发牌、其他玩家出牌导致的手牌刷新）
    const handChanged =
      currentHandIds.size !== prevHandIds.size ||
      Array.from(currentHandIds).some((id) => !prevHandIds.has(id))

    if (handChanged) {
      // 过滤掉已不存在的卡牌 ID（使用函数式更新确保获取最新值）
      setSelectedCardIds((prevSelectedIds) => {
        const validSelectedIds = prevSelectedIds.filter((id) =>
          currentHandIds.has(id)
        )
        return validSelectedIds
      })

      // 更新引用
      prevHandIdsRef.current = currentHandIds
    }
    // 只依赖 myHand，不依赖 selectedCardIds，避免无限循环
  }, [myHand])

  // 开始游戏
  const handleStart = useCallback(async () => {
    try {
      await startGameRef.current(roomId)
    } catch (e) {
      showToast({
        message: '开始失败（请查看控制台）',
        kind: 'error',
        action: {
          label: '重试',
          onClick: () => {
            startGameRef.current(roomId).catch(() => {
              /* ignore */
            })
          },
        },
      })
    }
  }, [roomId, showToast, startGameRef])

  // 复制房间链接
  const copyRoomLink = useCallback(async () => {
    const url = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: '房间链接已复制', kind: 'success' })
    } catch {
      showToast({
        message: '复制失败，请手动复制：' + url,
        kind: 'error',
        timeoutMs: 6000,
      })
    }
  }, [roomId, showToast])

  // 加入房间（覆盖层触发）
  const handleOverlayJoin = useCallback(() => {
    joinRoom(roomId)
      .then(() =>
        heartbeatRoomMember(roomId).catch(() => {
          /* ignore */
        })
      )
      .catch((e: unknown) => {
        showToast({
          message: mapSupabaseErrorToMessage(e, '加入失败'),
          kind: 'error',
          action: {
            label: '重试',
            onClick: () => {
              joinRoom(roomId)
                .then(() =>
                  heartbeatRoomMember(roomId).catch(() => {
                    /* ignore */
                  })
                )
                .catch(() => {
                  /* ignore */
                })
            },
          },
        })
      })
  }, [roomId, joinRoom, heartbeatRoomMember, showToast])

  // 点击卡牌
  const handleCardClick = useCallback(
    (id: number) => {
      setSelectedCardIds((prev) =>
        prev.includes(id)
          ? prev.filter((cid) => cid !== id)
          : [...prev, id]
      )
    },
    []
  )

  // 出牌
  const handlePlay = useCallback(async () => {
    if (selectedCardIds.length === 0) {
      showToast({ message: '请选择要出的牌', kind: 'info' })
      return
    }

    // 验证所有选中的卡牌仍在手牌中
    // 防止：手牌因 Realtime 更新刷新后，已选中的卡牌不再存在
    const currentHandIds = new Set(myHand.map((c) => c.id))
    const missingCards = selectedCardIds.filter((id) => !currentHandIds.has(id))

    if (missingCards.length > 0) {
      // 清理无效的选中状态并静默返回
      // 这样可以避免在 AI 回合时弹出多个提示
      setSelectedCardIds((prev) => prev.filter((id) => currentHandIds.has(id)))
      return
    }

    const selectedCards = myHand.filter((c) => selectedCardIds.includes(c.id))
    const myMove = analyzeMove(selectedCards, levelRank)
    if (!myMove) {
      showToast({ message: '暂不支持该牌型', kind: 'info' })
      return
    }

    // 获取上一手牌（如果实时连接不健康则从数据库获取）
    const contextLastAction = realtimeHealthy
      ? lastAction
      : await fetchLastTrickPlay()

    // 检查是否能压过上家
    if (
      contextLastAction &&
      typeof contextLastAction === 'object' &&
      'type' in contextLastAction &&
      contextLastAction.type === 'play' &&
      'cards' in contextLastAction &&
      Array.isArray(contextLastAction.cards) &&
      contextLastAction.cards.length > 0
    ) {
      const lastMove = analyzeMove(contextLastAction.cards, levelRank)
      if (lastMove && !canBeat(myMove, lastMove)) {
        showToast({ message: '压不住上一手', kind: 'info' })
        return
      }
    }

    // 提交出牌
    const result = await useGameStore.getState().submitTurn(
      'play',
      selectedCards
    )
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      // 如果状态已刷新（竞态条件），清除选择并静默返回
      if ('refreshed' in result && result.refreshed) {
        setSelectedCardIds([])
        return
      }
      const errorMessage =
        result.error instanceof Error
          ? result.error.message
          : String(result.error)
      showToast({ message: `出牌失败: ${errorMessage}`, kind: 'error' })
    } else {
      playSound('play')
      setSelectedCardIds([])
    }
  }, [
    selectedCardIds,
    myHand,
    levelRank,
    realtimeHealthy,
    lastAction,
    fetchLastTrickPlay,
    showToast,
    playSound,
  ])

  // 过牌
  const handlePass = useCallback(async () => {
    const result = await useGameStore.getState().submitTurn('pass')
    if (result && typeof result === 'object' && 'error' in result && result.error) {
      // 如果状态已刷新（竞态条件），清除选择并静默返回
      if ('refreshed' in result && result.refreshed) {
        setSelectedCardIds([])
        return
      }
      const errorMessage =
        result.error instanceof Error
          ? result.error.message
          : String(result.error)
      showToast({ message: `过牌失败: ${errorMessage}`, kind: 'error' })
    } else {
      setSelectedCardIds([])
    }
  }, [showToast])

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

  return {
    selectedCardIds,
    setSelectedCardIds,
    handleStart,
    copyRoomLink,
    handleOverlayJoin,
    handleCardClick,
    handlePlay,
    handlePass,
    handlePause,
    handleResume,
  }
}
