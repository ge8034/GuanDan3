'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useRef } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface VictoryEffectProps {
  visible: boolean
  type: 'victory' | 'defeat'
  onComplete?: () => void
  duration?: number
}

interface Particle {
  id: number
  x: number
  y: number
  delay: number
  size: number
  color: string
}

interface Confetti {
  id: number
  x: number
  y: number
  delay: number
  rotation: number
  color: string
}

export default function VictoryEffect({ visible, type, onComplete, duration = 4000 }: VictoryEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [confetti, setConfetti] = useState<Confetti[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()
  const hasShownRef = useRef(false)

  const show = useMemo(() => visible, [visible])

  useEffect(() => {
    if (visible) {
      if (!hasShownRef.current) {
        hasShownRef.current = true
      }
      const timer = setTimeout(() => {
        onComplete?.()
      }, duration)
      return () => clearTimeout(timer)
    } else {
      hasShownRef.current = false
    }
  }, [visible, duration, onComplete])

  const shouldGenerateParticles = useMemo(() => visible, [visible])

  useEffect(() => {
    if (shouldGenerateParticles) {
      const timer = setTimeout(() => {
        setParticles(Array.from({ length: 80 }, (_, i) => ({
          id: i,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          delay: Math.random() * 0.8,
          size: Math.random() * 8 + 4,
          color: type === 'victory' 
            ? ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#32CD32'][Math.floor(Math.random() * 6)]
            : ['#696969', '#808080', '#A9A9A9', '#C0C0C0', '#778899'][Math.floor(Math.random() * 5)]
        })))

        setConfetti(Array.from({ length: 40 }, (_, i) => ({
          id: i,
          x: Math.random() * 100 - 50,
          y: Math.random() * 100 - 50,
          delay: Math.random() * 1.2,
          rotation: Math.random() * 360,
          color: type === 'victory'
            ? ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1', '#32CD32'][Math.floor(Math.random() * 6)]
            : ['#696969', '#808080', '#A9A9A9', '#C0C0C0'][Math.floor(Math.random() * 4)]
        })))
      }, 0)

      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setParticles([])
        setConfetti([])
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [shouldGenerateParticles, type])

  if (prefersReducedMotion) {
    return (
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center bg-black/50"
          >
            <div className="text-center">
              <div className="text-6xl mb-4">
                {type === 'victory' ? '🎉' : '😢'}
              </div>
              <div className={`text-4xl font-bold ${type === 'victory' ? 'text-yellow-400' : 'text-gray-400'}`}>
                {type === 'victory' ? '胜利！' : '失败'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${type === 'victory' ? 'bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-red-900/30' : 'bg-gradient-to-br from-gray-900/40 via-slate-800/30 to-gray-900/40'}`}
          />
          
          {type === 'victory' && (
            <>
              {particles.map((particle) => (
                <motion.div
                  key={`particle-${particle.id}`}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: particle.x * 12,
                    y: particle.y * 12,
                    scale: [0, 1.5, 1],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2.5,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                  }}
                />
              ))}

              {confetti.map((conf) => (
                <motion.div
                  key={`confetti-${conf.id}`}
                  initial={{
                    x: 0,
                    y: 0,
                    rotate: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: conf.x * 15,
                    y: conf.y * 15,
                    rotate: conf.rotation,
                    scale: [0, 1.2, 1],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 3,
                    delay: conf.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute"
                  style={{
                    width: 8,
                    height: 12,
                    backgroundColor: conf.color,
                    boxShadow: `0 0 8px ${conf.color}`
                  }}
                />
              ))}
            </>
          )}

          {type === 'defeat' && (
            <>
              {particles.map((particle) => (
                <motion.div
                  key={`particle-${particle.id}`}
                  initial={{
                    x: 0,
                    y: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: particle.x * 8,
                    y: particle.y * 8,
                    scale: [0, 1.2, 0.8],
                    opacity: [1, 0.8, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    boxShadow: `0 0 ${particle.size}px ${particle.color}`
                  }}
                />
              ))}
            </>
          )}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.3
            }}
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-9xl mb-6"
            >
              {type === 'victory' ? '🎉' : '😢'}
            </motion.div>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className={`text-7xl font-bold mb-4 ${
                type === 'victory' 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-slate-400 to-gray-500'
              }`}
            >
              {type === 'victory' ? '胜利！' : '失败'}
            </motion.div>

            {type === 'victory' && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="text-2xl text-yellow-300 font-medium"
              >
                恭喜你获得胜利！
              </motion.div>
            )}

            {type === 'defeat' && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="text-2xl text-gray-400 font-medium"
              >
                再接再厉，下次一定能赢！
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
