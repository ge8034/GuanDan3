'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'
import { useSound } from '@/lib/hooks/useSound'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { analyzeMove, canBeat } from '@/lib/game/rules'
import { useRoomGameDerived } from '@/lib/hooks/useRoomGameDerived'
import { useRoomAuth } from '@/lib/hooks/useRoomAuth'
import { useRoomData } from '@/lib/hooks/useRoomData'
import { useRoomSubscription } from '@/lib/hooks/useRoomSubscription'
import { useRoomHeartbeat } from '@/lib/hooks/useRoomHeartbeat'
import { useRoomRecovery } from '@/lib/hooks/useRoomRecovery'
import { useRoomAI } from '@/lib/hooks/useRoomAI'

import { PlayerAvatar } from './PlayerAvatar'
import { RoomHeader } from './RoomHeader'
import { TableArea } from './TableArea'
import { HandArea } from './HandArea'
import { RoomOverlays } from './RoomOverlays'
import { GameOverOverlay } from './GameOverOverlay'

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  
  // Stores (Actions & State)
  const { currentRoom, members, joinRoom, toggleReady, leaveRoom, heartbeatRoomMember } = useRoomStore()
  const { 
    gameId, status: gameStatus, turnNo, currentSeat, levelRank, myHand, lastAction,
    startGame, submitTurn, counts, rankings, fetchLastTrickPlay, fetchGame
  } = useGameStore()

  // Derived State
  const {
    myMember,
    mySeat,
    seatText,
    isOwner,
    isMyTurn,
    getRankTitle,
    getMemberBySeat,
    currentPlayerType,
    isOnline,
  } = useRoomGameDerived()
  
  const isMember = !!myMember

  // Hooks (Controller Logic)
  const { authReady } = useRoomAuth()
  const { roomLoaded } = useRoomData(roomId, authReady)
  const { isHealthy: realtimeHealthy, error: realtimeError } = useRoomSubscription(authReady ? roomId : '')
  
  useRoomHeartbeat(roomId, authReady, roomLoaded, isMember, isOwner)
  useRoomRecovery(roomId, authReady, roomLoaded, isMember, myHand.length)
  
  const { debugLog, addDebugLog } = useRoomAI(
    roomId, 
    isOwner, 
    gameStatus, 
    currentSeat, 
    turnNo, 
    members, 
    getMemberBySeat
  )

  // Local UI State
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
  const { playSound } = useSound()
  const { showToast, toastView } = useToast()
  const [isDebugVisible, setIsDebugVisible] = useState(false)

  // Sound Effects Logic
  useEffect(() => {
    if (isMyTurn) {
      playSound('turn')
    }
  }, [isMyTurn, playSound])

  useEffect(() => {
    if (gameStatus === 'finished') {
      playSound('win')
    }
  }, [gameStatus, playSound])
  
  const handleStart = async () => {
    try {
      await startGame(roomId)
    } catch (e) {
      showToast({
        message: '开始失败（请查看控制台）',
        kind: 'error',
        action: {
          label: '重试',
          onClick: () => {
            startGame(roomId).catch(() => {})
          }
        }
      })
    }
  }

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: '房间链接已复制', kind: 'success' })
    } catch {
      showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
    }
  }

  const handleOverlayJoin = () => {
    joinRoom(roomId)
      .then(() => heartbeatRoomMember(roomId).catch(() => {}))
      .catch((e: any) => {
        showToast({
          message: mapSupabaseErrorToMessage(e, '加入失败'),
          kind: 'error',
          action: {
            label: '重试',
            onClick: () => {
              joinRoom(roomId)
                .then(() => heartbeatRoomMember(roomId).catch(() => {}))
                .catch(() => {})
            }
          }
        })
      })
  }

  const handleCardClick = (id: number) => {
    setSelectedCardIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const handlePlay = async () => {
    if (selectedCardIds.length === 0) {
      showToast({ message: '请选择要出的牌', kind: 'info' })
      return
    }
    const selectedCards = myHand.filter(c => selectedCardIds.includes(c.id))
    const myMove = analyzeMove(selectedCards, levelRank)
    if (!myMove) {
      showToast({ message: '暂不支持该牌型', kind: 'info' })
      return
    }
    const contextLastAction = realtimeHealthy ? lastAction : await fetchLastTrickPlay()
    if (contextLastAction?.type === 'play' && contextLastAction.cards && contextLastAction.cards.length > 0) {
      const lastMove = analyzeMove(contextLastAction.cards, levelRank)
      if (lastMove && !canBeat(myMove, lastMove)) {
        showToast({ message: '压不住上一手', kind: 'info' })
        return
      }
    }
    const result = await submitTurn('play', selectedCards)
    if (result?.error) {
      showToast({ message: `出牌失败: ${result.error.message}`, kind: 'error' })
    } else {
      playSound('play')
      setSelectedCardIds([])
    }
  }

  const handlePass = async () => {
    const result = await submitTurn('pass')
    if (result?.error) {
      showToast({ message: `过牌失败: ${result.error.message}`, kind: 'error' })
    } else {
      setSelectedCardIds([])
    }
  }

  return (
    <div className="flex flex-col h-screen bg-green-800 text-white overflow-hidden font-sans relative">
      {toastView}
      {!realtimeHealthy && (
        <div data-testid="room-realtime-banner" className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 px-4 py-2">
          实时连接状态：{realtimeError ? '错误' : '连接中/断开'}
        </div>
      )}

      <RoomOverlays
        authReady={authReady}
        roomLoaded={roomLoaded}
        hasRoom={!!currentRoom}
        roomStatus={currentRoom?.status}
        roomName={currentRoom?.name}
        isMember={!!myMember}
        membersCount={members.length}
        onBackLobby={() => router.push('/lobby')}
        onCopyLink={() => {
          copyRoomLink().catch(() => {})
        }}
        onRefresh={() => router.refresh()}
        onJoin={handleOverlayJoin}
        onCancelBack={() => window.history.back()}
      />

      {/* DEBUG INFO TOGGLE */}
      <button 
        onClick={() => setIsDebugVisible(!isDebugVisible)}
        className="fixed top-16 right-2 z-[9999] bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70"
      >
        {isDebugVisible ? '隐藏调试' : '调试'}
      </button>

      {/* DEBUG INFO PANEL */}
      {isDebugVisible && (
        <div className="fixed top-24 right-2 bg-black/90 text-green-400 p-2 rounded text-[10px] z-[9999] shadow-xl border border-green-500/30 max-w-[200px]">
          <div className="font-bold mb-1 border-b border-gray-600">调试面板</div>
          <div>回合号：{turnNo}</div>
          <div>当前座位：{currentSeat}（{currentPlayerType}）</div>
          <div>我的座位：{myMember?.seat_no ?? '无'}</div>
          <div>是否我方回合：{isMyTurn ? '是' : '否'}</div>
          <div>是否房主：{isOwner ? '是' : '否'}</div>
          <div>Realtime: {realtimeHealthy ? 'OK' : 'Issue'}</div>
          <div className="mt-1 border-t border-gray-600 pt-1">
            <div className="font-bold">日志：</div>
            {debugLog.map((l, i) => <div key={i} className="truncate">{l}</div>)}
          </div>
          {isOwner && currentPlayerType === 'ai' && (
            <button 
              onClick={async () => {
                try {
                  addDebugLog('强制：提交中...');
                  const res = await submitTurn('pass');
                  if (res?.error) {
                     addDebugLog(`强制错误：${res.error.message}`);
                     showToast({ message: `强制错误：${res.error.message}`, kind: 'error' })
                     // If turn mismatch, try to refresh explicitly
                     if (res.error.message?.includes('turn_no_mismatch')) {
                        await fetchGame(roomId)
                     }
                  } else {
                     addDebugLog('强制：成功');
                     await fetchGame(roomId); // Force refresh
                  }
                } catch (e: any) {
                  addDebugLog(`强制错误：${e.message}`);
                  showToast({ message: `错误：${e.message}`, kind: 'error' })
                }
              }}
              className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
            >
              强制 AI 过牌
            </button>
          )}
        </div>
      )}

      <GameOverOverlay visible={gameStatus === 'finished'} rankings={rankings} mySeat={mySeat} isOwner={isOwner} onRestart={handleStart} />

      <RoomHeader
        roomId={roomId}
        roomStatus={currentRoom?.status}
        gameStatus={gameStatus}
        levelRank={levelRank}
        seatText={seatText}
        isOwner={isOwner}
        showLeave={currentRoom?.status === 'open'}
        onLeave={async () => {
          if (confirm('确定要离开房间吗？')) {
            try {
              await leaveRoom(roomId)
              router.push('/lobby')
            } catch (e: any) {
              showToast({ message: mapSupabaseErrorToMessage(e, '离开房间失败'), kind: 'error' })
            }
          }
        }}
        showStart={currentRoom?.status === 'open'}
        startDisabled={currentRoom?.mode === 'pvp4' && members.length < 4}
        startLabel={currentRoom?.mode === 'pvp4' && members.length < 4 ? `等待玩家（${members.length}/4）` : '开始游戏'}
        onStart={handleStart}
        currentSeat={currentSeat}
      />
      
      <main className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr_auto] w-full h-full relative z-0">
        {/* Row 1: Top (Opposite) - 对家 */}
        <div className="col-start-2 row-start-1 flex justify-center pt-4 pb-2 z-10">
           {(() => {
             const seat = (mySeat + 2) % 4
             const member = getMemberBySeat(seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={isOnline(seat)}
                 roomStatus={currentRoom?.status}
               />
             )
           })()}
        </div>

        {/* Row 2 Left: Left (Previous) - 上家 */}
        <div className="col-start-1 row-start-2 flex items-center justify-start pl-4 z-10">
           {(() => {
             const seat = (mySeat + 3) % 4
             const member = getMemberBySeat(seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={isOnline(seat)}
                 roomStatus={currentRoom?.status}
               />
             )
           })()}
        </div>

        {/* Row 2 Center: Table Area (Last Action) */}
        <div className="col-start-2 row-start-2 flex justify-center items-center z-0">
          <TableArea
            roomStatus={currentRoom?.status}
            membersCount={members.length}
            myMemberReady={myMember ? myMember.ready : null}
            onToggleReady={(nextReady) => toggleReady(roomId, nextReady)}
            lastAction={lastAction as any}
            mySeat={mySeat}
          />
        </div>

        {/* Row 2 Right: Right (Next) - 下家 */}
        <div className="col-start-3 row-start-2 flex items-center justify-end pr-4 z-10">
           {(() => {
             const seat = (mySeat + 1) % 4
             const member = getMemberBySeat(seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={isOnline(seat)}
                 roomStatus={currentRoom?.status}
               />
             )
           })()}
        </div>

        {/* Row 3: My Hand (In Grid Flow) */}
        <div className="col-start-1 col-span-3 row-start-3 w-full h-64 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent z-20 relative">
          
          {/* My Avatar (Bottom Left Overlay) */}
          <div className="absolute bottom-4 left-4 z-30 transform scale-75 origin-bottom-left opacity-80 hover:opacity-100 transition-opacity">
             <PlayerAvatar 
               seatNo={mySeat}
               isCurrentTurn={isMyTurn}
               cardCount={myHand.length}
               memberType="human"
               isMe={true}
               rankTitle={getRankTitle(mySeat)}
               isReady={myMember?.ready ?? false}
               isOnline={myMember?.online ?? true}
               roomStatus={currentRoom?.status}
             />
          </div>

          <HandArea
            isMyTurn={isMyTurn}
            selectedCardIds={selectedCardIds}
            onPlay={handlePlay}
            onPass={handlePass}
            onCardClick={handleCardClick}
            myHand={myHand}
            rankings={rankings}
            mySeat={mySeat}
            gameStatus={gameStatus}
            getRankTitle={getRankTitle}
          />
          
        </div>
      </main>
    </div>
  )
}
