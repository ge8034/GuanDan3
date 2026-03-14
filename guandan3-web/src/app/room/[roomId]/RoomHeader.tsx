'use client'

export type RoomHeaderProps = {
  roomId: string
  roomStatus?: string | null
  gameStatus: string
  levelRank: number
  seatText: string
  isOwner: boolean
  showLeave: boolean
  onLeave: () => void
  showStart: boolean
  startDisabled: boolean
  startLabel: string
  onStart: () => void
  currentSeat: number
}

export const RoomHeader = ({
  roomId,
  roomStatus,
  gameStatus,
  levelRank,
  seatText,
  isOwner,
  showLeave,
  onLeave,
  showStart,
  startDisabled,
  startLabel,
  onStart,
  currentSeat,
}: RoomHeaderProps) => {
  const levelLabel = levelRank === 11 ? 'J' : levelRank === 12 ? 'Q' : levelRank === 13 ? 'K' : levelRank === 14 ? 'A' : String(levelRank)

  return (
    <header className="p-4 bg-green-900 flex justify-between items-center shadow-md z-10">
      <div>
        <h1 className="text-xl font-bold">房间：{roomId?.slice(0, 8)}...</h1>
        <p className="text-xs opacity-70">状态：{roomStatus} | 牌局：{gameStatus} | 级牌：{levelLabel} | 座位：{seatText}</p>
      </div>
      <div className="flex gap-2">
        {showLeave && (
          <button
            onClick={onLeave}
            data-testid="room-leave"
            className="bg-red-900/50 hover:bg-red-800 text-white px-3 py-2 rounded text-sm transition border border-red-800"
          >
            离开房间
          </button>
        )}
        {showStart && isOwner && (
          <button
            onClick={onStart}
            disabled={startDisabled}
            data-testid="room-start"
            className="bg-yellow-500 px-4 py-2 rounded text-black font-bold hover:bg-yellow-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startLabel}
          </button>
        )}
        {gameStatus === 'playing' && (
          <div className="bg-blue-600 px-3 py-1 rounded text-sm">回合：座位 {currentSeat}</div>
        )}
      </div>
    </header>
  )
}

