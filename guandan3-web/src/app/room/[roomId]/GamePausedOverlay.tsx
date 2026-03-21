'use client'

import RippleEffect from '@/components/effects/RippleEffect'

export type GamePausedOverlayProps = {
  visible: boolean
  pausedBy?: string | null
  pausedAt?: string | null
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

  const formatPausedTime = (timestamp: string | null | undefined) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 z-[50] bg-black/70 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-md w-full text-center animate-in zoom-in duration-300">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">游戏已暂停</h2>
          <p className="text-gray-600">
            {pauseReason ? `暂停原因：${pauseReason}` : '游戏暂时暂停'}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">暂停时间：</span>
            <span className="font-semibold text-gray-900">{formatPausedTime(pausedAt)}</span>
          </div>
          {pausedBy && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">暂停玩家：</span>
              <span className="font-semibold text-gray-900">玩家 {pausedBy.slice(0, 8)}...</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onResume}
            data-testid="game-paused-resume"
            className="w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-600 transition transform hover:scale-105 shadow-lg"
          >
            恢复游戏
          </button>
          <p className="text-sm text-gray-500">
            点击&ldquo;恢复游戏&rdquo;按钮继续对局
          </p>
        </div>
      </div>
    </div>
  )
}
