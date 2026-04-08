'use client'

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { ThemeMode, GameTheme, themeConfigs, ThemeConfig } from './theme-types'
import { logger } from '@/lib/utils/logger'
interface ThemeContextType {
  mode: ThemeMode
  gameTheme: GameTheme
  theme: GameTheme // 别名，方便使用
  setMode: (mode: ThemeMode) => void
  setGameTheme: (theme: GameTheme) => void
  currentTheme: ThemeConfig
  isDark: boolean
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  // 挂载状态，用于避免 Hydration 不匹配
  const [mounted, setMounted] = useState(false)

  // 使用懒初始化从 localStorage 读取初始值
  const [mode, setMode] = useState<ThemeMode>('light')
  const [gameTheme, setGameTheme] = useState<GameTheme>('classic')

  // 客户端挂载后读取 localStorage 中的真实主题
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    if (savedMode) {
      setMode(savedMode)
    }

    const savedGameTheme = localStorage.getItem('game-theme') as GameTheme
    if (savedGameTheme) {
      setGameTheme(savedGameTheme)
    } else {
      // 从环境变量读取默认主题
      const envTheme = process.env.NEXT_PUBLIC_THEME as GameTheme
      if (envTheme === 'poker') {
        setGameTheme('poker')
        localStorage.setItem('game-theme', 'poker')
      }
    }

    setMounted(true)
  }, [])
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeConfig>>({})

  useEffect(() => {
    const loadCustomThemes = () => {
      try {
        const stored = localStorage.getItem('guandan3_custom_themes')
        if (stored) {
          const themes = JSON.parse(stored) as ThemeConfig[]
          const themesMap = Object.fromEntries(themes.map(t => [t.id, t]))
          setCustomThemes(themesMap)
        }
      } catch (error) {
        logger.error('Failed to load custom themes:', error)
      }
    }

    loadCustomThemes()
  }, [])

  const isDark = useMemo(() => {
    if (mode === 'auto') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      return false
    }
    return mode === 'dark'
  }, [mode])

  useEffect(() => {
    localStorage.setItem('theme-mode', mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem('game-theme', gameTheme)
  }, [gameTheme])

  const currentTheme = useMemo(() => {
    // 未挂载时使用默认主题，避免 Hydration 不匹配
    if (!mounted) {
      return themeConfigs.classic
    }
    if (gameTheme.startsWith('custom_')) {
      return customThemes[gameTheme] || themeConfigs.classic
    }
    return themeConfigs[gameTheme] || themeConfigs.classic
  }, [gameTheme, customThemes, mounted])

  return (
    <ThemeContext.Provider
      value={{
        mode,
        gameTheme,
        theme: gameTheme, // 添加theme别名
        setMode,
        setGameTheme,
        currentTheme,
        isDark,
        mounted
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
