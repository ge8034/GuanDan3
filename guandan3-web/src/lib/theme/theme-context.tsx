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
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<ThemeMode>('light')
  const [gameTheme, setGameTheme] = useState<GameTheme>('classic')
  const [customThemes, setCustomThemes] = useState<Record<string, ThemeConfig>>({})

  useEffect(() => {
    setMounted(true)
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode
    const savedGameTheme = localStorage.getItem('game-theme') as GameTheme
    if (savedMode) setMode(savedMode)
    if (savedGameTheme) setGameTheme(savedGameTheme)
  }, [])

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
