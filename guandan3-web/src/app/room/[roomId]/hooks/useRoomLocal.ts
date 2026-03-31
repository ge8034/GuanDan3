/**
 * 房间页面本地 UI 状态 Hook
 *
 * 管理所有非持久化的本地 UI 状态
 */

import { useState, useCallback, useEffect } from 'react'

interface RoomLocalResult {
  difficulty: 'easy' | 'medium' | 'hard'
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard') => void
  isDebugVisible: boolean
  setIsDebugVisible: (value: boolean | ((prev: boolean) => boolean)) => void
}

export function useRoomLocal(): RoomLocalResult {
  // AI 难度设置（持久化到 localStorage）
  const [difficulty, setDifficultyState] = useState<
    'easy' | 'medium' | 'hard'
  >(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guandan3-ai-difficulty')
      return saved === 'easy' || saved === 'medium' || saved === 'hard'
        ? saved
        : 'medium'
    }
    return 'medium'
  })

  // 调试面板可见性
  const [isDebugVisible, setIsDebugVisible] = useState(false)

  // 更新难度时保存到 localStorage
  const setDifficulty = useCallback(
    (newDifficulty: 'easy' | 'medium' | 'hard') => {
      setDifficultyState(newDifficulty)
      if (typeof window !== 'undefined') {
        localStorage.setItem('guandan3-ai-difficulty', newDifficulty)
      }
    },
    []
  )

  return {
    difficulty,
    setDifficulty,
    isDebugVisible,
    setIsDebugVisible,
  }
}
