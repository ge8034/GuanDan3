'use client'

import { cn } from '@/lib/utils'

interface QuickPhrasesProps {
  onPhraseSelect: (phrase: string) => void
  className?: string
}

const QUICK_PHRASES = [
  '你好！',
  '来一局吗？',
  '快点出牌',
  '这把打得不错',
  '下次再战',
  '不好意思，我有事要先走了',
  '谢谢！',
  '不客气',
  '哈哈',
  '加油！',
  '你太厉害了',
  '再接再厉',
]

export default function QuickPhrases({ onPhraseSelect, className }: QuickPhrasesProps) {
  return (
    <div className={cn('bg-card border border-border rounded-lg shadow-lg p-3', className)}>
      <div className="text-sm font-medium text-text-primary mb-2">快捷语</div>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            onClick={() => onPhraseSelect(phrase)}
            className="px-3 py-2 text-sm text-text-primary bg-bg-secondary hover:bg-primary/10 rounded-lg transition-colors text-left"
          >
            {phrase}
          </button>
        ))}
      </div>
    </div>
  )
}
