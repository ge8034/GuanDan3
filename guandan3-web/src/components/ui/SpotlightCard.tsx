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
        "group relative border border-border bg-card overflow-hidden rounded-xl",
        "transition-all duration-500 ease-out", // 平滑过渡
        hover && "cursor-pointer hover:shadow-lg hover:-translate-y-1", // 增强悬停反馈
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
