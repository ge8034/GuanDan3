'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'
import { Star } from 'lucide-react'

interface ComboEffectProps {
  visible: boolean
  comboCount: number
  onComplete?: () => void
  duration?: number
}

export default function ComboEffect({ visible, comboCount, onComplete, duration = 2000 }: ComboEffectProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const hasShownRef = useRef(false)

  const show = useMemo(() => visible && comboCount >= 2, [visible, comboCount])

  useEffect(() => {
    if (visible && comboCount >= 2) {
      if (!hasShownRef.current) {
        hasShownRef.current = true
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        hasShownRef.current = false
        onComplete?.()
      }, duration)
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
      }
    } else {
      hasShownRef.current = false
    }
  }, [visible, comboCount, duration, onComplete])

  if (prefersReducedMotion) {
    return (
      <AnimatePresence>
        {show && comboCount >= 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
          >
            <div className="text-4xl font-bold text-yellow-400">
              {comboCount >= 10 ? '十连击！' : 
               comboCount >= 8 ? '八连击！' : 
               comboCount >= 6 ? '六连击！' : 
               comboCount >= 5 ? '五连击！' : 
               comboCount >= 4 ? '四连击！' : 
               comboCount >= 3 ? '三连击！' : '二连击！'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  const getComboText = () => {
    if (comboCount >= 10) return '十连击！'
    if (comboCount >= 8) return '八连击！'
    if (comboCount >= 6) return '六连击！'
    if (comboCount >= 5) return '五连击！'
    if (comboCount >= 4) return '四连击！'
    if (comboCount >= 3) return '三连击！'
    if (comboCount >= 2) return '二连击！'
    return ''
  }

  const getComboColor = () => {
    if (comboCount >= 10) return 'from-purple-500 via-pink-500 to-red-500'
    if (comboCount >= 8) return 'from-blue-500 via-purple-500 to-pink-500'
    if (comboCount >= 6) return 'from-cyan-500 via-blue-500 to-purple-500'
    if (comboCount >= 5) return 'from-green-500 via-cyan-500 to-blue-500'
    if (comboCount >= 4) return 'from-yellow-500 via-green-500 to-cyan-500'
    if (comboCount >= 3) return 'from-orange-500 via-yellow-500 to-green-500'
    return 'from-red-500 via-orange-500 to-yellow-500'
  }

  const getComboEmoji = () => {
    if (comboCount >= 10) return '🔥🔥🔥'
    if (comboCount >= 8) return '🔥🔥'
    if (comboCount >= 6) return '🔥'
    if (comboCount >= 5) return '⚡'
    if (comboCount >= 4) return '💫'
    if (comboCount >= 3) return '✨'
    return '💪'
  }

  const comboText = getComboText()
  const comboColor = getComboColor()
  const comboEmoji = getComboEmoji()

  return (
    <AnimatePresence>
      {show && comboText && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.3 }}
          className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <motion.div
            initial={{ y: 0, rotate: -5 }}
            animate={{ y: -20, rotate: 5 }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative"
            >
              <div className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r ${comboColor} drop-shadow-2xl`}>
                {comboText}
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="text-4xl md:text-5xl text-center mt-2"
              >
                {comboEmoji}
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-400/20 to-red-400/20 rounded-full blur-2xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="absolute -top-4 -right-4 text-2xl"
            >
              <motion.span
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Star className="w-6 h-6" fill="currentColor" />
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="absolute -bottom-4 -left-4 text-2xl"
            >
              <motion.span
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Star className="w-6 h-6" fill="currentColor" />
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
