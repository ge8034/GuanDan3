'use client'

import { motion } from 'framer-motion'
import React from 'react'
import Card from './Card/index'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  delay?: number
  index?: number
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  hover = false, 
  onClick,
  delay = 0,
  index = 0
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: delay + index * 0.1,
        ease: [0.4, 0, 0.2, 1] as const
      }}
      whileHover={hover ? { scale: 1.02, y: -4 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
    >
      <Card hover={hover} className={className} onClick={onClick}>
        {children}
      </Card>
    </motion.div>
  )
}
