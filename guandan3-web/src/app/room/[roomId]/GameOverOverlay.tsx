'use client'

import RippleEffect from '@/components/effects/RippleEffect'

export type GameOverOverlayProps = {
  visible: boolean
  rankings: number[]
  mySeat: number
  isOwner: boolean
  onRestart: () => void
}

export const GameOverOverlay = ({ visible, rankings, mySeat, isOwner, onRestart }: GameOverOverlayProps) => {
  if (!visible) return null

  return (
    <div data-testid="game-over-overlay" className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center backdrop-blur-md">
      <div className="bg-gradient-to-br from-yellow-900 to-black border-2 border-yellow-500 rounded-xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
        <h2 className="text-4xl font-bold text-yellow-400 mb-6 drop-shadow-md">游戏结束</h2>
        <div className="space-y-4">
          {rankings.map((seat, index) => (
            <div key={seat} data-testid={`ranking-${index}`} data-seat={seat} className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🥔'}</span>
                <span className="font-bold text-lg text-white">{seat === mySeat ? '我' : `座位 ${seat}`}</span>
              </div>
              <span className="text-yellow-200 font-mono font-bold">
                {index === 0 ? '头游' : index === 1 ? '二游' : index === 2 ? '三游' : '末游'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-center gap-4">
          {isOwner ? (
            <RippleEffect className="relative inline-block">
              <button
                onClick={onRestart}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
              >
                再来一局
              </button>
            </RippleEffect>
          ) : (
            <div className="text-white/60">等待房主开始新游戏...</div>
          )}
        </div>
      </div>
    </div>
  )
}

