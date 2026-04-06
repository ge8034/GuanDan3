'use client'

import { useState, useEffect } from 'react'
import { ThemeConfig } from '@/lib/theme/theme-types'

const CUSTOM_THEMES_KEY = 'guandan3_custom_themes'

export function useCustomThemes() {
  const [customThemes, setCustomThemes] = useState<ThemeConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCustomThemes()
  }, [])

  const loadCustomThemes = () => {
    try {
      const stored = localStorage.getItem(CUSTOM_THEMES_KEY)
      if (stored) {
        const themes = JSON.parse(stored)
        setCustomThemes(themes)
      }
    } catch (error) {
      console.error('Failed to load custom themes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCustomTheme = (theme: ThemeConfig) => {
    try {
      const updatedThemes = [...customThemes, theme]
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedThemes))
      setCustomThemes(updatedThemes)
      return true
    } catch (error) {
      console.error('Failed to save custom theme:', error)
      return false
    }
  }

  const deleteCustomTheme = (themeId: string) => {
    try {
      const updatedThemes = customThemes.filter(theme => theme.id !== themeId)
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedThemes))
      setCustomThemes(updatedThemes)
      return true
    } catch (error) {
      console.error('Failed to delete custom theme:', error)
      return false
    }
  }

  const updateCustomTheme = (themeId: string, updatedTheme: ThemeConfig) => {
    try {
      const updatedThemes = customThemes.map(theme =>
        theme.id === themeId ? updatedTheme : theme
      )
      localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(updatedThemes))
      setCustomThemes(updatedThemes)
      return true
    } catch (error) {
      console.error('Failed to update custom theme:', error)
      return false
    }
  }

  const exportTheme = (theme: ThemeConfig) => {
    try {
      const dataStr = JSON.stringify(theme, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${theme.name.replace(/\s+/g, '_')}_theme.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Failed to export theme:', error)
      return false
    }
  }

  const importTheme = (file: File): Promise<ThemeConfig> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const theme = JSON.parse(e.target?.result as string)
          resolve(theme)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  return {
    customThemes,
    isLoading,
    saveCustomTheme,
    deleteCustomTheme,
    updateCustomTheme,
    exportTheme,
    importTheme,
    loadCustomThemes
  }
}
