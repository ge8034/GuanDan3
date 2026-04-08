import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const skeletonVariants = cva(
  'animate-pulse bg-beige/50 rounded',
  {
    variants: {
      variant: {
        default: 'bg-beige/50',
        light: 'bg-beige/30',
        dark: 'bg-gray-200',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      rounded: 'md',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string
  height?: string
}

function Skeleton({ className, width, height, variant, rounded, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ variant, rounded }), className)}
      style={{ width, height }}
      {...props}
    />
  )
}

/**
 * 卡片骨架屏 - 用于房间卡片等卡片内容加载
 */
export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton width="3rem" height="3rem" rounded="full" />
        <div className="space-y-2 flex-1">
          <Skeleton height="1.25rem" width="60%" />
          <Skeleton height="1rem" width="40%" />
        </div>
      </div>
      <Skeleton height="3.75rem" />
      <div className="flex gap-2">
        <Skeleton height="2rem" width="5rem" />
        <Skeleton height="2rem" width="5rem" />
      </div>
    </div>
  )
}

/**
 * 表格行骨架屏 - 用于列表数据加载
 */
export function TableRowSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-border">
      <Skeleton width="2.5rem" height="2.5rem" rounded="full" />
      <Skeleton height="1.25rem" width="30%" />
      <Skeleton height="1.25rem" width="20%" />
      <Skeleton height="1.25rem" width="15%" />
    </div>
  )
}

/**
 * 头像骨架屏 - 用于用户头像加载
 */
export function AvatarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  return <Skeleton className={sizes[size]} rounded="full" />
}

/**
 * 文本骨架屏 - 用于文本内容加载
 */
export function TextSkeleton({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="1rem"
          width={i === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  )
}

/**
 * 按钮骨架屏 - 用于按钮加载状态
 */
export function ButtonSkeleton({ width = '6.25rem', height = '2.5rem' }: { width?: string; height?: string }) {
  return <Skeleton width={width} height={height} rounded="lg" />
}

export default Skeleton
