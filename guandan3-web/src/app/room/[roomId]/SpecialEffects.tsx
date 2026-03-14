import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { Card } from '@/lib/store/game'
import { useSound } from '@/lib/hooks/useSound'

type SpecialEffectsProps = {
  lastAction: { seatNo: number; type: string; cards?: Card[] } | null
}

export const SpecialEffects = ({ lastAction }: SpecialEffectsProps) => {
  const [activeEffect, setActiveEffect] = useState<'bomb' | 'straight' | null>(null)
  const [effectKey, setEffectKey] = useState(0)
  const { playSound } = useSound()
  const lastActionRef = useRef(lastAction)
  const effectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!lastAction) return

    const prevAction = lastActionRef.current
    lastActionRef.current = lastAction

    if (prevAction?.type === lastAction.type) {
      return
    }

    let effectType: 'bomb' | 'straight' | null = null
    if (lastAction.type === 'bomb') {
      effectType = 'bomb'
    } else if (lastAction.type === 'straight' || lastAction.type === 'sequencePairs') {
      effectType = 'straight'
    }

    if (!effectType) return

    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current)
    }

    playSound(effectType)

    const duration = effectType === 'bomb' ? 2000 : 1500
    effectTimeoutRef.current = setTimeout(() => {
      setActiveEffect(null)
      effectTimeoutRef.current = null
    }, duration)

    requestAnimationFrame(() => {
      setActiveEffect(effectType)
      setEffectKey(prev => prev + 1)
    })

    return () => {
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current)
      }
    }
  }, [lastAction, playSound])

  return (
    <AnimatePresence>
      {activeEffect === 'bomb' && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            key="bomb-effect"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: 1, rotate: [0, -10, 10, 0] }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative flex flex-col items-center"
          >
            <div className="relative">
              <div className="text-9xl filter drop-shadow-[0_0_20px_rgba(255,100,0,0.8)]">💣</div>
              <motion.div 
                className="absolute inset-0 bg-orange-500 rounded-full mix-blend-screen filter blur-xl"
                animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              />
            </div>
            <motion.div
              className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-red-600 mt-4 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              BOMB!
            </motion.div>
          </motion.div>
        </div>
      )}

      {activeEffect === 'straight' && (
        <motion.div
          key="straight-effect"
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '100%', opacity: 1 }} // 简单的从左到右划过可能有点生硬，改成从左进入停留再消失
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 1.0, ease: 'easeInOut' }}
          className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden"
        >
           <motion.div 
             className="w-[120%] h-32 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent -skew-x-12 flex items-center justify-center"
             initial={{ x: '-100%' }}
             animate={{ x: '100%' }}
             transition={{ duration: 1.5, ease: 'linear' }}
           >
              <div className="text-6xl font-bold text-white italic tracking-widest drop-shadow-lg skew-x-12">
                STRAIGHT
              </div>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
