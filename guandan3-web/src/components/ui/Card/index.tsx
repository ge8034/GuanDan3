'use client'

import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        // 增强的poker主题卡片样式
        "poker-card border-2 border-poker-table-border bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-xl overflow-hidden transition-all duration-200 outline-none",
        hover && "cursor-pointer hover:shadow-lg hover:border-accent-gold/50",
        onClick && "cursor-pointer hover:shadow-lg hover:border-accent-gold/50",
        "focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2",
        className
      )}
      onClick={onClick}
      tabIndex={hover || onClick ? 0 : undefined}
      role={hover || onClick ? 'button' : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 md:p-6 border-b border-poker-table-border/50", className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 md:p-6", className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 md:p-6 border-t border-poker-table-border/50 bg-poker-table/10", className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-4 md:p-6", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}
