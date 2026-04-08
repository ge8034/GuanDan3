'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  hover?: boolean
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(255, 255, 255, 0.25)",
  hover = false,
  ...props
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovered, setIsHovered] = useState(false)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn(
        "group relative border border-poker-table-border bg-gradient-to-br from-white to-gray-50 overflow-hidden rounded-xl focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 outline-none",
        "transition-all duration-300 ease-out", // 统一过渡时长
        hover && "cursor-pointer hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)] hover:border-accent-gold", // 移除translate-y
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 40%
            )
          `,
        }}
      />
      <div className="relative h-full flex flex-col">
        {children}
      </div>
    </div>
  )
}

export function SpotlightCardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 border-b border-border/50", className)} {...props}>
      {children}
    </div>
  )
}

export function SpotlightCardBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  )
}

export function SpotlightCardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 border-t border-border/50 bg-surface/30", className)} {...props}>
      {children}
    </div>
  )
}
