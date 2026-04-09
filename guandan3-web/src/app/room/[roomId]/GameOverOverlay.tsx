/**
 * GameOverOverlay 组件
 * 使用设计系统组件重构版本
 */

'use client'

import { Button } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'

export type GameOverOverlayProps = {
  visible: boolean
  rankings: number[]
  mySeat: number
  isOwner: boolean
  onRestart: () => void
}

export const GameOverOverlay = ({ visible, rankings, mySeat, isOwner, onRestart }: GameOverOverlayProps) => {
  if (!visible) return null

  const getRankEmoji = (index: number) => {
    if (index === 0) return '👑'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return '🥔'
  }

  const getRankTitle = (index: number) => {
    if (index === 0) return '头游'
    if (index === 1) return '二游'
    if (index === 2) return '三游'
    return '末游'
  }

  return (
    <div
      data-testid="game-over-overlay"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <Card
        className={cn(
          'max-w-md w-full mx-4 p-8 text-center',
          'bg-gradient-to-br from-amber-900 to-black',
          'border-2 border-yellow-500',
          'shadow-2xl'
        )}
      >
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 drop-shadow-md">
          游戏结束
        </h2>
        <div className="flex flex-col gap-4">
          {rankings.map((seat, index) => (
            <div
              key={seat}
              data-testid={`ranking-${index}`}
              data-seat={seat}
              className={cn(
                'flex justify-between items-center',
                'p-3 rounded-lg',
                'bg-white/10',
                'border border-white/5'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getRankEmoji(index)}</span>
                <span className="font-semibold text-lg text-white">
                  {seat === mySeat ? '我' : `座位 ${seat}`}
                </span>
              </div>
              <span className="text-yellow-200 font-mono font-semibold">
                {getRankTitle(index)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center">
          {isOwner ? (
            <Button
              onClick={onRestart}
              variant="primary"
              className={cn(
                'bg-yellow-500 text-black font-semibold',
                'px-8 py-3 rounded-full',
                'shadow-lg',
                'hover:bg-yellow-400',
                'transition-opacity'
              )}
            >
              再来一局
            </Button>
          ) : (
            <div className="text-white/60">
              等待房主开始新游戏...
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
