'use client'

import { Card } from '@/lib/store/game'
import { CardView } from './CardView'

export type TableAreaProps = {
  roomStatus?: string | null
  membersCount: number
  myMemberReady: boolean | null
  onToggleReady: (nextReady: boolean) => void
  lastAction: { seatNo: number; type: 'play' | 'pass'; cards?: Card[] } | null
  mySeat: number
}

export const TableArea = ({
  roomStatus,
  membersCount,
  myMemberReady,
  onToggleReady,
  lastAction,
  mySeat,
}: TableAreaProps) => {
  return (
    <div className="w-full max-w-sm h-48 bg-green-700/30 rounded-xl flex flex-col items-center justify-center border-4 border-green-600/20 relative transition-all duration-300">
      {roomStatus === 'open' ? (
        <div className="text-center">
          <div className="text-white/60 mb-4 font-mono text-sm">等待玩家加入...（{membersCount}/4）</div>
          {myMemberReady !== null && (
            <button
              onClick={() => onToggleReady(!myMemberReady)}
              data-testid="room-ready-toggle"
              className={`px-8 py-3 rounded-full font-bold shadow-xl transition transform active:scale-95 ${
                myMemberReady ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' : 'bg-green-500 text-white hover:bg-green-400 scale-110'
              }`}
            >
              {myMemberReady ? '取消准备' : '准备'}
            </button>
          )}
        </div>
      ) : lastAction ? (
        <>
          <div className="absolute top-2 left-3 text-xs font-mono text-green-200 bg-black/30 px-2 py-1 rounded">
            上一手：{lastAction.seatNo === mySeat ? '我' : `座位 ${lastAction.seatNo}`}
          </div>
          {lastAction.type === 'pass' ? (
            <div className="text-white/40 text-3xl font-bold tracking-widest animate-pulse">过牌</div>
          ) : (
            <div className="flex -space-x-8 px-8 py-2 overflow-x-auto max-w-full justify-center">
              {lastAction.cards?.map((card, i) => (
                <CardView key={i} card={card} variant="table" />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center opacity-20">
          <div className="text-green-300 text-6xl mb-2">♣</div>
          <div className="text-green-300 text-sm font-mono">新一轮</div>
        </div>
      )}
    </div>
  )
}
