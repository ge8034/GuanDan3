'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
import { ThemeMode, GameTheme, themeConfigs, ThemeConfig } from './theme-types'

interface ThemeContextType {
  mode: ThemeMode
  gameTheme: GameTheme
  setMode: (mode: ThemeMode) => void
  setGameTheme: (theme: GameTheme) => void
  currentTheme: ThemeConfig
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('theme-mode') as ThemeMode
      return savedMode || 'light'
    }
    return 'light'
  })
  const [gameTheme, setGameTheme] = useState<GameTheme>(() => {
    if (typeof window !== 'undefined') {
      const savedGameTheme = localStorage.getItem('game-theme') as GameTheme
      return savedGameTheme || 'classic'
    }
    return 'classic'
  })
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
        console.error('Failed to load custom themes:', error)
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
    if (gameTheme.startsWith('custom_')) {
      return customThemes[gameTheme] || themeConfigs.classic
    }
    return themeConfigs[gameTheme] || themeConfigs.classic
  }, [gameTheme, customThemes])

  return (
    <ThemeContext.Provider
      value={{
        mode,
        gameTheme,
        setMode,
        setGameTheme,
        currentTheme,
        isDark
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
