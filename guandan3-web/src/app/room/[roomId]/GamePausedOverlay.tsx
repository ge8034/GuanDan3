/**
 * GamePausedOverlay 组件
 * 使用设计系统组件重构版本
 */

'use client'

import { Pause } from 'lucide-react'
import { Button } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'

export type GamePausedOverlayProps = {
  visible: boolean
  pausedBy?: string | null
  pausedAt?: Date | null
  pauseReason?: string | null
  onResume: () => void
}

export const GamePausedOverlay = ({
  visible,
  pausedBy,
  pausedAt,
  pauseReason,
  onResume,
}: GamePausedOverlayProps) => {
  if (!visible) return null

  const formatPausedTime = (timestamp: Date | null | undefined) => {
    if (!timestamp) return ''
    return timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <Card className="max-w-md w-full mx-4 p-8 text-center bg-white text-black shadow-2xl">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <Pause className="w-10 h-10 text-amber-500" strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold mb-2 text-neutral-900">
            游戏已暂停
          </h2>
          <p className="text-neutral-600">
            {pauseReason ? `暂停原因：${pauseReason}` : '游戏暂时暂停'}
          </p>
        </div>

        <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-neutral-600">暂停时间：</span>
            <span className="font-semibold text-neutral-900">{formatPausedTime(pausedAt)}</span>
          </div>
          {pausedBy && (
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">暂停玩家：</span>
              <span className="font-semibold text-neutral-900">
                玩家 {pausedBy.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={onResume}
            data-testid="game-paused-resume"
            variant="primary"
            className="w-full bg-success-500 hover:bg-success-600"
          >
            恢复游戏
          </Button>
          <p className="text-sm text-neutral-400">
            点击"恢复游戏"按钮继续对局
          </p>
        </div>
      </Card>
    </div>
  )
}
