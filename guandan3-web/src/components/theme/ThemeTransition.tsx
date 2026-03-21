'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/lib/theme/theme-context'
import { useEffect, useState, useRef } from 'react'

export default function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { currentTheme, isDark } = useTheme()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const themeKeyRef = useRef(`${currentTheme.id}-${isDark}`)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const newThemeKey = `${currentTheme.id}-${isDark}`
    if (themeKeyRef.current !== newThemeKey) {
      themeKeyRef.current = newThemeKey
      
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      
      timerRef.current = setTimeout(() => {
        setIsTransitioning(true)
        setTimeout(() => setIsTransitioning(false), 300)
      }, 0)
    }
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [currentTheme, isDark])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentTheme.id}-${isDark}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          backgroundColor: isDark ? '#1a1a1a' : currentTheme.colors.background,
          color: currentTheme.colors.text,
          minHeight: '100vh'
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
