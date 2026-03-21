'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  className?: string
}

const EMOJI_CATEGORIES = [
  { name: '常用', emojis: ['😀', '😂', '🤣', '😊', '😍', '🥰', '😘', '😎', '🤔', '😴'] },
  { name: '游戏', emojis: ['🎮', '🎯', '🏆', '🎲', '🃏', '🎪', '🎭', '🎨', '🎬', '🎤'] },
  { name: '手势', emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '👌', '✋', '🤙'] },
  { name: '心情', emojis: ['❤️', '💔', '💯', '✨', '🔥', '💪', '🎉', '🎊', '🌟', '⭐'] },
  { name: '动物', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🦁'] },
]

export default function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0)

  return (
    <div className={cn('bg-card border border-border rounded-lg shadow-lg', className)}>
      <div className="flex border-b border-border overflow-x-auto">
        {EMOJI_CATEGORIES.map((category, index) => (
          <button
            key={category.name}
            onClick={() => setActiveCategory(index)}
            className={cn(
              'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              activeCategory === index
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="p-3">
        <div className="grid grid-cols-5 gap-2">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onEmojiSelect(emoji)}
              className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-bg-secondary rounded-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
