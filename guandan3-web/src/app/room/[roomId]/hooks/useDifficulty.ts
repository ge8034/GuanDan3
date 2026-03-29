import { useState, useEffect } from 'react'

/**
 * AI 难度设置 Hook
 *
 * 从 localStorage 读取和保存难度设置
 */
export function useDifficulty(roomId: string) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guandan3-ai-difficulty')
      return (saved === 'easy' || saved === 'medium' || saved === 'hard') ? saved : 'medium'
    }
    return 'medium'
  })

  // 持久化到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guandan3-ai-difficulty', difficulty)
    }
  }, [difficulty])

  return { difficulty, setDifficulty }
}
