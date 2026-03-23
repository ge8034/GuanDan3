'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
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
import { useGameStats } from '@/lib/hooks/useGameStats'
import { usePerformanceMonitor, useFPSMonitor, useNetworkStatus } from '@/lib/performance/optimization'

import { PlayerAvatar } from './PlayerAvatar'
import { RoomHeader } from './RoomHeader'
import { TableArea } from './TableArea'
import { HandArea } from './HandArea'
import { RoomOverlays } from './RoomOverlays'
import { GameOverOverlay } from './GameOverOverlay'
import { GamePausedOverlay } from './GamePausedOverlay'
import { SpecialEffects } from './SpecialEffects'
import GamePauseResume from '@/components/game/GamePauseResume'
import { GameDealAnimation } from '@/components/animations/GameDealAnimation.lazy'
import { PlayCardAnimation } from '@/components/animations/PlayCardAnimation.lazy'
import { VictoryEffect } from '@/components/animations/VictoryEffect.lazy'
import { ComboEffect } from '@/components/animations/ComboEffect.lazy'

import { AIStatusPanel } from './AIStatusPanel.lazy'
import { EnhancedChatBox } from '@/components/chat/EnhancedChatBox.lazy'
import { RoomInvitationPanel } from '@/components/room/RoomInvitationPanel.lazy'
import { VoiceCallPanel } from '@/components/voice/VoiceCallPanel.lazy'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import RippleEffect from '@/components/effects/RippleEffect'
import { GameHintsPanel } from '@/components/game/GameHintsPanel'

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  
  // Stores (Actions & State)
  const { currentRoom, members, joinRoom, addAI, toggleReady, leaveRoom, heartbeatRoomMember } = useRoomStore()
  const { 
    gameId, status: gameStatus, turnNo, currentSeat, levelRank, myHand, lastAction,
    startGame, submitTurn, counts, rankings, fetchLastTrickPlay, fetchGame,
    pauseGame, resumeGame, pausedBy, pausedAt, pauseReason
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
  
  // Local UI State
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('guandan3-ai-difficulty')
      return (saved === 'easy' || saved === 'medium' || saved === 'hard') ? saved : 'medium'
    }
    return 'medium'
  })
  
  const { debugLog, addDebugLog, agentStatuses } = useRoomAI(
    roomId, 
    isOwner, 
    gameStatus, 
    currentSeat, 
    turnNo, 
    members, 
    getMemberBySeat,
    difficulty
  )

  // Performance Monitoring
  usePerformanceMonitor('RoomPage')
  const fps = useFPSMonitor()
  const { isOnline: networkOnline, effectiveType } = useNetworkStatus()
  const { playSound } = useSound()
  const { showToast, toastView } = useToast()
  
  // Game Statistics Collection
  useGameStats()

  // Auto-start game for practice mode
  const autoStartStartedRef = useRef(false)
  useEffect(() => {
    // 练习模式自动开始游戏
    const shouldAutoStart =
      currentRoom?.mode === 'pve1v3' && // 练习模式
      gameStatus === 'deal' && // 游戏未开始
      roomLoaded && // 房间已加载
      isOwner && // 是房主
      !autoStartStartedRef.current && // 未尝试过自动开始
      !gameId // 没有游戏ID

    // DEBUG: 打印自动开始条件
    if (currentRoom) {
      console.log('[AutoStart] 检查自动开始条件:', {
        mode: currentRoom?.mode,
        expectedMode: 'pve1v3',
        gameStatus,
        expectedStatus: 'deal',
        roomLoaded,
        isOwner,
        autoStartStarted: autoStartStartedRef.current,
        gameId,
        shouldStart: shouldAutoStart
      })
    }

    if (shouldAutoStart) {
      console.log('[AutoStart] 满足所有条件，准备自动开始游戏')
      autoStartStartedRef.current = true
      const timer = setTimeout(async () => {
        try {
          console.log('[AutoStart] 调用 startGame')
          await startGame(roomId)
          console.log('[AutoStart] startGame 完成')
        } catch (e) {
          console.error('[AutoStart] Failed to start practice game:', e)
        }
      }, 1000) // 延迟1秒确保房间状态已同步
      return () => clearTimeout(timer)
    }
  }, [currentRoom?.mode, gameStatus, roomLoaded, isOwner, gameId, roomId, startGame])

  const [isDebugVisible, setIsDebugVisible] = useState(false)
  const [showDealAnimation, setShowDealAnimation] = useState(false)
  const [showPlayAnimation, setShowPlayAnimation] = useState(false)
  const previousStatusRef = useRef<string | null>(null)
  const [playAnimationCards, setPlayAnimationCards] = useState<any[]>([])
  const [playAnimationFromSeat, setPlayAnimationFromSeat] = useState(0)
  const [playAnimationToSeat, setPlayAnimationToSeat] = useState(0)
  const [showVictoryEffect, setShowVictoryEffect] = useState(false)
  const [victoryType, setVictoryType] = useState<'victory' | 'defeat'>('victory')
  const [showComboEffect, setShowComboEffect] = useState(false)
  const [comboCount, setComboCount] = useState(0)
  const lastPlaySeatRef = useRef<number | null>(null)
  
  // Persist difficulty to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guandan3-ai-difficulty', difficulty)
    }
  }, [difficulty])

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

  useEffect(() => {
    if (previousStatusRef.current === 'deal' && gameStatus === 'playing') {
      const timer = setTimeout(() => {
        setShowDealAnimation(true)
      }, 0)
      return () => clearTimeout(timer)
    }
    previousStatusRef.current = gameStatus
  }, [gameStatus])

  useEffect(() => {
    if (lastAction?.type === 'play' && lastAction.cards && lastAction.cards.length > 0) {
      const timer = setTimeout(() => {
        setPlayAnimationCards(lastAction.cards || [])
        setPlayAnimationFromSeat(lastAction.seatNo)
        setPlayAnimationToSeat(currentSeat)
        setShowPlayAnimation(true)

        if (lastAction.seatNo === lastPlaySeatRef.current) {
          setComboCount(prev => prev + 1)
          setShowComboEffect(true)
        } else {
          setComboCount(1)
          lastPlaySeatRef.current = lastAction.seatNo
        }
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [lastAction, currentSeat])

  useEffect(() => {
    if (gameStatus === 'finished' && rankings.length > 0) {
      const myRanking = rankings.indexOf(mySeat)
      if (myRanking !== -1) {
        const timer = setTimeout(() => {
          setVictoryType(myRanking === 0 || myRanking === 1 ? 'victory' : 'defeat')
          setShowVictoryEffect(true)
        }, 0)
        return () => clearTimeout(timer)
      }
    }
  }, [gameStatus, rankings, mySeat])

  const handleDealAnimationComplete = useCallback(() => {
    setShowDealAnimation(false)
  }, [])

  const handlePlayAnimationComplete = useCallback(() => {
    setShowPlayAnimation(false)
  }, [])

  const handleVictoryEffectComplete = useCallback(() => {
    setShowVictoryEffect(false)
  }, [])

  const handleComboEffectComplete = useCallback(() => {
    setShowComboEffect(false)
  }, [])

  const memoizedPlayerAvatars = useMemo(() => {
    const seats = [
      { seat: (mySeat + 2) % 4, position: 'opposite' },
      { seat: (mySeat + 3) % 4, position: 'left' },
      { seat: (mySeat + 1) % 4, position: 'right' }
    ]

    return seats.map(({ seat, position }) => {
      const member = members.find(m => m.seat_no === seat)
      return {
        seat,
        position,
        member,
        isCurrentTurn: currentSeat === seat,
        cardCount: counts[seat] ?? 27,
        memberType: member?.member_type ?? 'unknown',
        isReady: member?.ready ?? false,
        isOnline: isOnline(seat),
        rankTitle: getRankTitle(seat)
      }
    })
  }, [mySeat, currentSeat, counts, members, rankings, isOnline, getRankTitle])
  
  const handleStart = useCallback(async () => {
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
  }, [roomId, showToast, startGame])

  const copyRoomLink = useCallback(async () => {
    const url = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: '房间链接已复制', kind: 'success' })
    } catch {
      showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
    }
  }, [roomId, showToast])

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

  const handlePause = async () => {
    try {
      await pauseGame('玩家主动暂停')
      showToast({ message: '游戏已暂停', kind: 'success' })
    } catch (e: any) {
      showToast({ message: `暂停失败: ${e.message}`, kind: 'error' })
    }
  }

  const handleResume = async () => {
    try {
      await resumeGame()
      showToast({ message: '游戏已恢复', kind: 'success' })
    } catch (e: any) {
      showToast({ message: `恢复失败: ${e.message}`, kind: 'error' })
    }
  }

  return (
    <SimpleEnvironmentBackground>
      <div className="flex flex-col h-screen text-black overflow-hidden font-sans relative">
        {toastView}
        {!realtimeHealthy && (
          <div data-testid="room-realtime-banner" className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 px-4 py-2 rounded-b-lg">
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

      <SpecialEffects lastAction={lastAction as any} />

      {/* DEBUG INFO TOGGLE */}
      <RippleEffect className="relative inline-block">
        <button 
          onClick={() => setIsDebugVisible(!isDebugVisible)}
          className="fixed bottom-20 left-4 z-[9999] bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 border border-white/20 shadow-lg"
        >
          {isDebugVisible ? '隐藏调试' : '调试'}
        </button>
      </RippleEffect>

      {/* DEBUG INFO PANEL */}
      <AIStatusPanel 
        visible={isDebugVisible} 
        logs={debugLog} 
        currentTurnSeat={currentSeat} 
        turnNo={turnNo} 
        agentStatuses={agentStatuses}
        difficulty={difficulty}
      />

      {/* PERFORMANCE MONITOR */}
      {isDebugVisible && (
        <div className="fixed bottom-20 left-20 z-[9999] bg-black/80 text-white text-xs p-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
          <div className="font-bold mb-2">性能监控</div>
          <div className="space-y-1">
            <div>FPS: <span className={fps >= 30 ? 'text-green-400' : fps >= 20 ? 'text-yellow-400' : 'text-red-400'}>{fps}</span></div>
            <div>网络: <span className={networkOnline ? 'text-green-400' : 'text-red-400'}>{networkOnline ? '在线' : '离线'}</span></div>
            {effectiveType && <div>连接类型: {effectiveType}</div>}
          </div>
        </div>
      )}

      <EnhancedChatBox
        roomId={roomId}
        userId={myMember?.uid || 'guest'}
        userName={myMember ? `座位 ${myMember.seat_no}` : '游客'}
      />

      <div className="fixed top-20 right-4 z-50">
        <VoiceCallPanel roomId={roomId} />
      </div>

      <GameHintsPanel />

      {isOwner && (
        <div className="fixed bottom-4 left-20 z-40">
          <RoomInvitationPanel roomId={roomId} isOwner={isOwner} />
        </div>
      )}

      <GameOverOverlay visible={gameStatus === 'finished'} rankings={rankings} mySeat={mySeat} isOwner={isOwner} onRestart={handleStart} />

      <GamePausedOverlay 
        visible={gameStatus === 'paused'} 
        pausedBy={pausedBy}
        pausedAt={pausedAt}
        pauseReason={pauseReason}
        onResume={handleResume}
      />

      <GamePauseResume roomId={roomId} isOwner={isOwner} />

      <GameDealAnimation 
        visible={showDealAnimation} 
        onComplete={handleDealAnimationComplete}
        dealSpeed={50}
      />

      <PlayCardAnimation
        visible={showPlayAnimation}
        cards={playAnimationCards}
        fromSeat={playAnimationFromSeat}
        toSeat={playAnimationToSeat}
        mySeat={mySeat}
        onComplete={handlePlayAnimationComplete}
        duration={0.6}
      />

      <VictoryEffect
        visible={showVictoryEffect}
        type={victoryType}
        onComplete={handleVictoryEffectComplete}
        duration={4000}
      />

      <ComboEffect
        visible={showComboEffect}
        comboCount={comboCount}
        onComplete={handleComboEffectComplete}
        duration={2000}
      />

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
        onAddAI={currentRoom?.mode === 'pvp4' && members.length < 4 ? () => addAI(roomId, difficulty).catch(e => showToast({ message: mapSupabaseErrorToMessage(e, '添加机器人失败'), kind: 'error' })) : undefined}
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        difficultyDisabled={gameStatus === 'playing'}
        isPaused={gameStatus === 'paused'}
        onPause={handlePause}
        onResume={handleResume}
        canPauseResume={gameStatus === 'playing' || gameStatus === 'paused'}
      />
      
      <main className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr_auto] w-full h-full relative z-0 md:grid-rows-[auto_1fr_auto] lg:grid-rows-[auto_1fr_auto] 2xl:grid-rows-[auto_1fr_auto]">
        {/* Row 1: Top (Opposite) - 对家 */}
        <div className="col-start-2 row-start-1 flex justify-center pt-2 sm:pt-4 pb-1 sm:pb-2 z-10 md:pt-6 md:pb-3 lg:pt-8 lg:pb-4 2xl:pt-10 2xl:pb-5">
           {(() => {
             const avatar = memoizedPlayerAvatars.find(a => a.position === 'opposite')
             return avatar ? (
               <PlayerAvatar 
                 seatNo={avatar.seat}
                 isCurrentTurn={avatar.isCurrentTurn}
                 cardCount={avatar.cardCount}
                 memberType={avatar.memberType}
                 isMe={false}
                 rankTitle={avatar.rankTitle}
                 isReady={avatar.isReady}
                 isOnline={avatar.isOnline}
                 roomStatus={currentRoom?.status}
               />
             ) : null
           })()}
        </div>

        {/* Row 2 Left: Left (Previous) - 上家 */}
        <div className="col-start-1 row-start-2 flex items-center justify-start pl-2 sm:pl-4 z-10 md:pl-6 lg:pl-8 2xl:pl-10">
           {(() => {
             const avatar = memoizedPlayerAvatars.find(a => a.position === 'left')
             return avatar ? (
               <PlayerAvatar 
                 seatNo={avatar.seat}
                 isCurrentTurn={avatar.isCurrentTurn}
                 cardCount={avatar.cardCount}
                 memberType={avatar.memberType}
                 isMe={false}
                 rankTitle={avatar.rankTitle}
                 isReady={avatar.isReady}
                 isOnline={avatar.isOnline}
                 roomStatus={currentRoom?.status}
               />
             ) : null
           })()}
        </div>

        {/* Row 2 Center: Table Area (Last Action) */}
        <div className="col-start-2 row-start-2 flex justify-center items-center z-0 px-1 sm:px-2 md:px-4 lg:px-6 2xl:px-8">
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
        <div className="col-start-3 row-start-2 flex items-center justify-end pr-2 sm:pr-4 z-10 md:pr-6 lg:pr-8 2xl:pr-10">
           {(() => {
             const avatar = memoizedPlayerAvatars.find(a => a.position === 'right')
             return avatar ? (
               <PlayerAvatar 
                 seatNo={avatar.seat}
                 isCurrentTurn={avatar.isCurrentTurn}
                 cardCount={avatar.cardCount}
                 memberType={avatar.memberType}
                 isMe={false}
                 rankTitle={avatar.rankTitle}
                 isReady={avatar.isReady}
                 isOnline={avatar.isOnline}
                 roomStatus={currentRoom?.status}
               />
             ) : null
           })()}
        </div>

        {/* Row 3: My Hand (In Grid Flow) */}
        <div className="col-start-1 col-span-3 row-start-3 w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 2xl:h-96 flex flex-col justify-end p-2 sm:p-4 md:p-5 lg:p-6 2xl:p-8 bg-gradient-to-t from-primary/10 to-transparent z-20 relative">
          
          {/* My Avatar (Bottom Left Overlay) */}
          <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-30 transform scale-60 sm:scale-75 md:scale-90 lg:scale-100 2xl:scale-110 origin-bottom-left opacity-80 hover:opacity-100 transition-opacity">
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
    </SimpleEnvironmentBackground>
  )
}
