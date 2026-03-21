'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/lib/theme/theme-context'
import { GameTheme, ThemeMode } from '@/lib/theme/theme-types'

export default function ThemeSelector() {
  const { mode, gameTheme, setMode, setGameTheme, currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const gameThemes: Array<{ id: GameTheme; name: string; description: string }> = [
    { id: 'classic', name: '雅致经典', description: '新中式水墨风格' },
    { id: 'modern', name: '现代主题', description: '简洁现代风格' },
    { id: 'retro', name: '复古主题', description: '怀旧像素风格' }
  ]

  const modeOptions: Array<{ id: ThemeMode; name: string; icon: string }> = [
    { id: 'light', name: '浅色', icon: '☀️' },
    { id: 'dark', name: '深色', icon: '🌙' },
    { id: 'auto', name: '自动', icon: '🔄' }
  ]

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        style={{
          backgroundColor: currentTheme.colors.surface,
          color: currentTheme.colors.text,
          border: `1px solid ${currentTheme.colors.border}`
        }}
      >
        <span className="text-xl">🎨</span>
        <span className="font-medium">{mounted ? currentTheme.name : '雅致经典'}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 rounded-xl shadow-2xl overflow-hidden z-50"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3" style={{ color: currentTheme.colors.text }}>
                游戏主题
              </h3>
              <div className="space-y-2 mb-6">
                {gameThemes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setGameTheme(theme.id)
                      setIsOpen(false)
                    }}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      gameTheme === theme.id ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: gameTheme === theme.id 
                        ? currentTheme.colors.primary 
                        : currentTheme.colors.background,
                      color: gameTheme === theme.id 
                        ? '#FFFFFF' 
                        : currentTheme.colors.text,
                      borderColor: currentTheme.colors.border
                    }}
                  >
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-sm opacity-80">{theme.description}</div>
                  </motion.button>
                ))}
              </div>

              <h3 className="text-lg font-semibold mb-3" style={{ color: currentTheme.colors.text }}>
                显示模式
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {modeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMode(option.id)}
                    className={`p-3 rounded-lg flex flex-col items-center gap-1 transition-all ${
                      mode === option.id ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: mode === option.id 
                        ? currentTheme.colors.primary 
                        : currentTheme.colors.background,
                      color: mode === option.id 
                        ? '#FFFFFF' 
                        : currentTheme.colors.text
                    }}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs font-medium">{option.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
