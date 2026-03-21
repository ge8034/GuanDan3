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
      'bg-[#4A7A2A]',
      'bg-[#5D8A3A]',
      'bg-[#6BA539]',
      'bg-[#2D5A1D]',
      'bg-[#3D6A2D]',
      'bg-[#1A4A0A]',
    ]
    const index = name.charCodeAt(0) % avatarColors.length
    return avatarColors[index]
  }

  const baseStyles = `flex items-center justify-center font-medium text-white overflow-hidden transition-transform duration-300 hover:scale-105 font-[family-name:var(--font-serif)]`
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
        <div className={`${combinedClassName} bg-[#D3D3D3]`}>
          <UserIcon size="lg" className="text-[#6BA539] w-1/2 h-1/2" />
        </div>
      )}
    </>
  )

  if (onClick) {
    return (
      <RippleEffect className="relative inline-block">
        <div className={combinedClassName} onClick={onClick}>
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
