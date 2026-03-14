'use client'

export type PlayerAvatarProps = {
  seatNo: number
  isCurrentTurn: boolean
  cardCount: number
  memberType: string
  isMe: boolean
  rankTitle: string | null
  isReady: boolean
  isOnline: boolean
  roomStatus?: string | null
}

export const PlayerAvatar = ({
  seatNo,
  isCurrentTurn,
  cardCount,
  memberType,
  isMe,
  rankTitle,
  isReady,
  isOnline,
  roomStatus,
}: PlayerAvatarProps) => {
  return (
    <div
      className={`flex flex-col items-center p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 ${
        isCurrentTurn ? 'scale-110 border-yellow-400/50 bg-black/60 z-20' : 'z-10'
      }`}
    >
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
            isCurrentTurn
              ? 'border-yellow-400 bg-gray-700 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
              : 'border-gray-600 bg-gray-800'
          }`}
        >
          <span className="text-3xl filter drop-shadow-lg transform hover:scale-110 transition-transform cursor-default">
            {memberType === 'ai' ? '🤖' : '👤'}
          </span>
        </div>

        {isReady && !rankTitle && roomStatus === 'open' && (
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-30 animate-in zoom-in">
            ✓
          </div>
        )}

        {memberType !== 'ai' && !isOnline && (
          <div className="absolute -bottom-1 -left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-md z-30">
            离线
          </div>
        )}

        {rankTitle && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-bounce">
            {rankTitle.split(' ')[0]}
          </div>
        )}

        {isCurrentTurn && !rankTitle && (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse z-30 font-bold border border-gray-200">
            思考中...
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-4 border-transparent border-t-white"></div>
          </div>
        )}
      </div>

      <div className="mt-2 text-center">
        <div className="font-bold text-sm text-gray-200 flex items-center justify-center gap-1 whitespace-nowrap">
          {isMe ? '我' : `座位 ${seatNo}`}
          {memberType === 'ai' && (
            <span className="text-[10px] bg-blue-600 px-1 rounded text-white font-mono">AI</span>
          )}
        </div>

        {!rankTitle ? (
          <div className={`text-xs font-mono mt-0.5 ${cardCount <= 5 ? 'text-red-400 font-bold animate-pulse' : 'text-gray-400'}`}>
            {cardCount} 张牌
          </div>
        ) : (
          <div className="text-yellow-400 font-bold text-xs mt-0.5 drop-shadow-md">{rankTitle.split(' ')[1]}</div>
        )}
      </div>
    </div>
  )
}

