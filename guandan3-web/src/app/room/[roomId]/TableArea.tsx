'use client'

import { memo, useCallback } from 'react'
import { Card } from '@/lib/store/game'
import { CardView } from './CardView'
import { Button } from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'

export type TableAreaProps = {
  roomStatus?: string | null
  membersCount: number
  myMemberReady: boolean | null
  onToggleReady: (nextReady: boolean) => void
  lastAction: { seatNo: number; type: 'play' | 'pass'; cards?: Card[] } | null
  mySeat: number
}

function TableAreaComponent({
  roomStatus,
  membersCount,
  myMemberReady,
  onToggleReady,
  lastAction,
  mySeat,
}: TableAreaProps) {
  const isPass = lastAction?.type === 'pass'
  
  const handleToggleReady = useCallback(() => {
    if (myMemberReady !== null) {
      onToggleReady(!myMemberReady)
    }
  }, [myMemberReady, onToggleReady])
  
  return (
    <div className="w-full max-w-xs sm:max-w-sm h-36 sm:h-48 rounded-xl flex flex-col items-center justify-center relative transition-all duration-300 backdrop-blur-[2px] shadow-inner bg-white/5 border border-white/10 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center justify-center">
         <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-white rounded-full"></div>
      </div>
      
      {roomStatus === 'open' ? (
        <div className="text-center z-10 px-2">
          <div className="text-white/80 mb-2 sm:mb-4 font-mono text-xs sm:text-sm font-medium drop-shadow-sm">等待玩家加入...（{membersCount}/4）</div>
          {myMemberReady !== null && (
            <Button
              onClick={handleToggleReady}
              data-testid="room-ready-toggle"
              variant={myMemberReady ? 'outline' : 'primary'}
              size="md"
              className={myMemberReady ? 'border-white/50 text-white hover:bg-white/10 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2' : 'scale-105 sm:scale-110 shadow-lg bg-emerald-600 hover:bg-emerald-500 text-white border-none text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2'}
            >
              {myMemberReady ? '取消准备' : '准备'}
            </Button>
          )}
        </div>
      ) : (
        <AnimatePresence mode='wait'>
          {lastAction ? (
            <motion.div
              key={`action-${lastAction.seatNo}-${lastAction.type}-${lastAction.cards?.[0]?.id}`}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full h-full flex flex-col items-center justify-center relative z-10"
            >
              <div className="absolute top-1 sm:top-2 left-2 sm:left-3 text-[10px] sm:text-xs font-mono text-white/90 bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md z-20 border border-white/10 backdrop-blur-sm shadow-sm">
                上一手：{lastAction.seatNo === mySeat ? '我' : `座位 ${lastAction.seatNo}`}
              </div>
              
              {isPass ? (
                <div className="text-white/80 text-2xl sm:text-3xl font-bold tracking-widest animate-pulse font-serif drop-shadow-lg">
                  过牌
                </div>
              ) : (
                <div className="flex -space-x-6 sm:-space-x-8 px-4 sm:px-8 py-1 sm:py-2 overflow-visible max-w-full justify-center items-center h-full pt-4 sm:pt-6">
                  {lastAction.cards?.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20, rotate: (i - (lastAction.cards!.length - 1) / 2) * 5 }}
                      animate={{ opacity: 1, y: 0, rotate: (i - (lastAction.cards!.length - 1) / 2) * 5 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CardView card={card} variant="table" index={i} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center pointer-events-none"
            >
              <div className="text-white text-4xl sm:text-6xl mb-1 sm:mb-2 animate-pulse opacity-50">♣</div>
              <div className="text-white text-xs sm:text-sm font-mono opacity-70">新一轮</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  )
}

export const TableArea = memo(TableAreaComponent)
