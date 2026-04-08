'use client'

import { useEffect } from 'react'
import { useTheme } from '@/lib/theme/theme-context'

/**
 * 主题初始化组件
 * 在首次访问时自动设置poker主题（如果配置了）
 */
export default function ThemeInitializer() {
  const { gameTheme, setGameTheme } = useTheme()

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return

    // 检查是否已设置过主题
    const savedTheme = localStorage.getItem('game-theme')
    console.log('[ThemeInitializer] Saved theme:', savedTheme)
    console.log('[ThemeInitializer] Current theme:', gameTheme)
    console.log('[ThemeInitializer] Env NEXT_PUBLIC_THEME:', process.env.NEXT_PUBLIC_THEME)

    // 如果没有保存过主题，且环境变量是poker，则自动设置
    if (!savedTheme && process.env.NEXT_PUBLIC_THEME === 'poker' && gameTheme !== 'poker') {
      console.log('[ThemeInitializer] Auto-setting poker theme')
      setGameTheme('poker')
      localStorage.setItem('game-theme', 'poker')
    }
  }, [gameTheme, setGameTheme])

  return null
}
