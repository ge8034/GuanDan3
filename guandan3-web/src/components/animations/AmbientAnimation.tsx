'use client'

import { motion } from 'framer-motion'

interface AmbientAnimationProps {
  children: React.ReactNode
  className?: string
}

export default function AmbientAnimation({ children, className }: AmbientAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        animate={{
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      >
        {children}
      </motion.div>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  )
}
