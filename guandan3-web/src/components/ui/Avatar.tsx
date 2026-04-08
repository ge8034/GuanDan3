import React from 'react'
import Image from 'next/image'
import { colors, borderRadius, typography } from '@/lib/design-tokens'
import RippleEffect from '@/components/effects/RippleEffect'
import { UserIcon } from '@/components/icons/LandscapeIcons'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export default function Avatar({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className = '',
  onClick,
}: AvatarProps) {
  const sizeStyles = {
    sm: 'w-8 h-8 text-xs rounded-lg',
    md: 'w-10 h-10 text-sm rounded-lg',
    lg: 'w-12 h-12 text-base rounded-lg',
    xl: 'w-16 h-16 text-lg rounded-lg',
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const avatarColors = [
      'bg-poker-table',
      'bg-poker-table-light',
      'bg-poker-table-dark',
      'bg-emerald-700',
      'bg-emerald-800',
      'bg-emerald-900',
    ]
    const index = name.charCodeAt(0) % avatarColors.length
    return avatarColors[index]
  }

  const baseStyles = `flex items-center justify-center font-medium text-white overflow-hidden transition-opacity duration-200 hover:opacity-90 font-[family-name:var(--font-serif)] border-2 border-poker-table-border shadow-[0_4px_12px_rgba(0,0,0,0.5)]`
  const combinedClassName = `${baseStyles} ${sizeStyles[size]} ${onClick ? 'cursor-pointer' : ''} ${className}`

  const avatarContent = (
    <>
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
          height={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
          className="w-full h-full object-cover"
        />
      ) : name ? (
        <div
          className={`${combinedClassName} ${getAvatarColor(name)}`}
          title={name}
        >
          {getInitials(name)}
        </div>
      ) : (
        <div className={`${combinedClassName} bg-border`}>
          <UserIcon size="lg" className="text-primary-500 w-1/2 h-1/2" />
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <RippleEffect className="relative inline-block">
        <div className={combinedClassName} onClick={onClick} role="button" tabIndex={0} aria-label={name || '用户头像'}>
          {avatarContent}
        </div>
      </RippleEffect>
    )
  }

  return (
    <div className={combinedClassName}>
      {avatarContent}
    </div>
  )
}
