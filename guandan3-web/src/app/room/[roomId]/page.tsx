/**
 * 房间页面主组件
 *
 * 游戏房间的主要容器，整合所有功能模块
 * 重构后使用模块化 hooks 和组件，提高可维护性
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'
import { useSound } from '@/lib/hooks/useSound'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { logger } from '@/lib/utils/logger'

// 现有 Hooks（保留）
import { useRoomGameDerived } from '@/lib/hooks/useRoomGameDerived'
import { useRoomAuth } from '@/lib/hooks/useRoomAuth'
import { useRoomData } from '@/lib/hooks/useRoomData'
import { useRoomSubscription } from '@/lib/hooks/useRoomSubscription'
import { useRoomHeartbeat } from '@/lib/hooks/useRoomHeartbeat'
import { useRoomRecovery } from '@/lib/hooks/useRoomRecovery'
import { useRoomAI } from '@/lib/hooks/useRoomAI'
import { useGameStats } from '@/lib/hooks/useGameStats'
import {
  usePerformanceMonitor,
  useFPSMonitor,
  useNetworkStatus,
} from '@/lib/performance/optimization'

// 新的模块化 Hooks
import {
  useRoomGameState,
  useRoomAnimations,
  useRoomHandlers,
  useRoomLocal,
  useMemoizedPlayerAvatars,
} from './hooks'

// 新的模块化组件
import {
  PlayerSeatsGrid,
  MyHandSection,
  RoomOverlaysContainer,
} from './components'

// 保留的原有组件
import { RoomHeader } from './RoomHeader'
import { TableArea } from './TableArea'
import { RoomOverlays } from './RoomOverlays'
import { SpecialEffects } from './SpecialEffects'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import RippleEffect from '@/components/effects/RippleEffect'

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()

  // ============ 状态管理（使用新的 hooks）============

  // 游戏状态（Zustand stores）
  const gameState = useRoomGameState({ roomId })

  // 本地 UI 状态
  const localState = useRoomLocal()

  // ============ 派生状态（保留现有 hooks）============
  const derivedState = useRoomGameDerived()

  // ============ 控制逻辑（保留现有 hooks）============
  const { authReady } = useRoomAuth()
  const { roomLoaded } = useRoomData(roomId, authReady)
  const { isHealthy: realtimeHealthy, error: realtimeError } =
    useRoomSubscription(authReady ? roomId : '')

  useRoomHeartbeat(
    roomId,
    authReady,
    roomLoaded,
    derivedState.isMember,
    derivedState.isOwner
  )
  useRoomRecovery(
    roomId,
    authReady,
    roomLoaded,
    derivedState.isMember,
    gameState.myHand.length
  )

  // ============ 性能监控 ============
  const fps = useFPSMonitor()
  const { isOnline: networkOnline, effectiveType } = useNetworkStatus()
  const { playSound } = useSound()
  const { showToast, toastView } = useToast()

  useGameStats()

  // ============ AI 调试 ============
  const { debugLog, addDebugLog, agentStatuses } = useRoomAI(
    roomId,
    derivedState.isOwner,
    gameState.gameStatus,
    gameState.currentSeat,
    gameState.turnNo,
    gameState.members,
    localState.difficulty
  )

  // ============ 动画状态 ============
  const animations = useRoomAnimations({
    gameStatus: gameState.gameStatus,
    lastAction: gameState.lastAction,
    currentSeat: gameState.currentSeat,
    rankings: gameState.rankings,
    mySeat: derivedState.mySeat,
  })

  // ============ 玩家头像数据 ============
  const memoizedPlayerAvatars = useMemoizedPlayerAvatars({
    mySeat: derivedState.mySeat,
    currentSeat: gameState.currentSeat,
    counts: gameState.counts,
    members: gameState.members,
    isOnline: derivedState.isOnline,
    getRankTitle: (seat: number) => derivedState.getRankTitle(seat) ?? '',
  })

  // ============ 事件处理 ============
  // 创建 showToast 适配器，将 useToast 的格式转换为 useRoomHandlers 期望的格式
  const showToastAdapter = useCallback((options: { message: string; kind: string; timeoutMs?: number; action?: { label: string; onClick: () => void } }) => {
    // 将 'warning' 转换为 'info'，因为 useToast 只支持 'success' | 'error' | 'info'
    const kind = options.kind === 'warning' ? 'info' : (options.kind as 'success' | 'error' | 'info')
    showToast({ message: options.message, kind, timeoutMs: options.timeoutMs, action: options.action })
  }, [showToast])

  const handlers = useRoomHandlers({
    roomId,
    joinRoom: gameState.joinRoom,
    heartbeatRoomMember: gameState.heartbeatRoomMember,
    fetchLastTrickPlay: gameState.fetchLastTrickPlay,
    pauseGame: gameState.pauseGame,
    resumeGame: gameState.resumeGame,
    myHand: gameState.myHand,
    levelRank: gameState.levelRank,
    lastAction: gameState.lastAction,
    startGameRef: gameState.startGameRef,
    showToast: showToastAdapter,
    playSound,
    realtimeHealthy,
  })

  // ============ 音效逻辑 ============
  const playSoundRef = useRef(playSound)
  playSoundRef.current = playSound

  useEffect(() => {
    if (derivedState.isMyTurn) {
      playSoundRef.current('turn')
    }
  }, [derivedState.isMyTurn])

  useEffect(() => {
    if (gameState.gameStatus === 'finished') {
      playSoundRef.current('win')
    }
  }, [gameState.gameStatus])

  // ============ 自动开始游戏（练习模式）============
  const autoStartStartedRef = useRef(false)
  useEffect(() => {
    const shouldAutoStart =
      gameState.currentRoom?.mode === 'pve1v3' &&
      gameState.gameStatus === 'deal' &&
      roomLoaded &&
      derivedState.isOwner &&
      !autoStartStartedRef.current &&
      !gameState.gameId

    if (shouldAutoStart) {
      logger.debug('[AutoStart] 触发自动开始')
      autoStartStartedRef.current = true
      const timer = setTimeout(async () => {
        try {
          await gameState.startGameRef.current(roomId)
        } catch (e) {
          logger.error('[AutoStart] Failed to start practice game:', e)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [
    gameState.currentRoom?.id,
    gameState.currentRoom?.mode,
    gameState.gameStatus,
    roomLoaded,
    derivedState.isOwner,
    gameState.gameId,
    roomId,
  ])

  // ============ 渲染 ============
  return (
    <SimpleEnvironmentBackground>
      <div className="flex flex-col h-screen text-black overflow-hidden font-sans relative">
        {toastView}

        {/* 实时连接状态 */}
        {!realtimeHealthy && (
          <div
            data-testid="room-realtime-banner"
            className="bg-yellow-100 text-yellow-900 border-b border-yellow-300 px-4 py-2 rounded-b-lg"
          >
            实时连接状态：{realtimeError ? '错误' : '连接中/断开'}
          </div>
        )}

        {/* 覆盖层 */}
        <RoomOverlays
          authReady={authReady}
          roomLoaded={roomLoaded}
          hasRoom={!!gameState.currentRoom}
          roomStatus={gameState.currentRoom?.status}
          roomName={gameState.currentRoom?.name}
          isMember={!!derivedState.myMember}
          membersCount={gameState.members.length}
          onBackLobby={() => router.push('/lobby')}
          onCopyLink={() => handlers.copyRoomLink().catch(() => {})}
          onRefresh={() => router.refresh()}
          onJoin={handlers.handleOverlayJoin}
          onCancelBack={() => window.history.back()}
        />

        {/* 特效 */}
        <SpecialEffects lastAction={gameState.lastAction} />

        {/* 调试按钮 */}
        <RippleEffect className="relative inline-block">
          <button
            onClick={() => localState.setIsDebugVisible((prev) => !prev)}
            className="fixed bottom-20 left-4 z-[9999] bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 border border-white/20 shadow-lg"
          >
            {localState.isDebugVisible ? '隐藏调试' : '调试'}
          </button>
        </RippleEffect>

        {/* 房间头部 */}
        <RoomHeader
          roomId={roomId}
          roomStatus={gameState.currentRoom?.status}
          gameStatus={gameState.gameStatus}
          levelRank={gameState.levelRank}
          seatText={derivedState.seatText}
          isOwner={derivedState.isOwner}
          showLeave={gameState.currentRoom?.status === 'open'}
          onLeave={async () => {
            if (confirm('确定要离开房间吗？')) {
              try {
                await gameState.leaveRoom(roomId)
                router.push('/lobby')
              } catch (e: unknown) {
                showToast({
                  message: mapSupabaseErrorToMessage(e, '离开房间失败'),
                  kind: 'error',
                })
              }
            }
          }}
          showStart={gameState.currentRoom?.status === 'open'}
          startDisabled={
            gameState.currentRoom?.mode === 'pvp4' &&
            gameState.members.length < 4
          }
          startLabel={
            gameState.currentRoom?.mode === 'pvp4' &&
            gameState.members.length < 4
              ? `等待玩家（${gameState.members.length}/4）`
              : '开始游戏'
          }
          onStart={handlers.handleStart}
          currentSeat={gameState.currentSeat}
          onAddAI={
            gameState.currentRoom?.mode === 'pvp4' &&
            gameState.members.length < 4
              ? () =>
                  gameState
                    .addAI(roomId, localState.difficulty)
                    .catch((e) =>
                      showToast({
                        message: mapSupabaseErrorToMessage(e, '添加机器人失败'),
                        kind: 'error',
                      })
                    )
              : undefined
          }
          difficulty={localState.difficulty}
          onDifficultyChange={localState.setDifficulty}
          difficultyDisabled={gameState.gameStatus === 'playing'}
          isPaused={gameState.gameStatus === 'paused'}
          onPause={handlers.handlePause}
          onResume={handlers.handleResume}
          canPauseResume={
            gameState.gameStatus === 'playing' ||
            gameState.gameStatus === 'paused'
          }
        />

        {/* 主游戏区域 */}
        <main className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr_auto] w-full h-full relative z-0">
          {/* 其他玩家座位 */}
          <PlayerSeatsGrid
            roomStatus={gameState.currentRoom?.status}
            memoizedPlayerAvatars={memoizedPlayerAvatars}
          />

          {/* 牌桌区域（中间） */}
          <div className="col-start-2 row-start-2 flex justify-center items-center z-0 px-1 sm:px-2 md:px-4 lg:px-6 2xl:px-8">
            <TableArea
              roomStatus={gameState.currentRoom?.status}
              membersCount={gameState.members.length}
              myMemberReady={derivedState.myMember ? derivedState.myMember.ready : null}
              onToggleReady={(nextReady) =>
                gameState.toggleReady(roomId, nextReady)
              }
              lastAction={gameState.lastAction}
              mySeat={derivedState.mySeat}
            />
          </div>

          {/* 我的手牌区域 */}
          <MyHandSection
            mySeat={derivedState.mySeat}
            isMyTurn={derivedState.isMyTurn}
            myHand={gameState.myHand}
            selectedCardIds={handlers.selectedCardIds}
            rankings={gameState.rankings}
            gameStatus={gameState.gameStatus}
            canPass={!!gameState.lastAction}
            getRankTitle={(seat: number) => derivedState.getRankTitle(seat) ?? ''}
            isReady={derivedState.myMember?.ready ?? false}
            isOnline={derivedState.myMember?.online ?? true}
            roomStatus={gameState.currentRoom?.status}
            onCardClick={handlers.handleCardClick}
            onPlay={handlers.handlePlay}
            onPass={handlers.handlePass}
          />
        </main>

        {/* 所有覆盖层和面板 */}
        <RoomOverlaysContainer
          roomId={roomId}
          gameStatus={gameState.gameStatus}
          pausedBy={gameState.pausedBy ?? undefined}
          pausedAt={gameState.pausedAt ? new Date(gameState.pausedAt) : undefined}
          pauseReason={gameState.pauseReason ?? undefined}
          isOwner={derivedState.isOwner}
          isDebugVisible={localState.isDebugVisible}
          difficulty={localState.difficulty}
          myMember={derivedState.myMember}
          rankings={gameState.rankings}
          mySeat={derivedState.mySeat}
          showDealAnimation={animations.showDealAnimation}
          showPlayAnimation={animations.showPlayAnimation}
          showVictoryEffect={animations.showVictoryEffect}
          showComboEffect={animations.showComboEffect}
          playAnimationCards={animations.playAnimationCards}
          playAnimationFromSeat={animations.playAnimationFromSeat}
          playAnimationToSeat={animations.playAnimationToSeat}
          victoryType={animations.victoryType}
          comboCount={animations.comboCount}
          fps={fps}
          networkOnline={networkOnline}
          effectiveType={effectiveType}
          debugLog={debugLog}
          currentSeat={gameState.currentSeat}
          turnNo={gameState.turnNo}
          agentStatuses={agentStatuses}
          onDealAnimationComplete={animations.handleDealAnimationComplete}
          onPlayAnimationComplete={animations.handlePlayAnimationComplete}
          onVictoryEffectComplete={animations.handleVictoryEffectComplete}
          onComboEffectComplete={animations.handleComboEffectComplete}
          onRestart={handlers.handleStart}
          onResume={handlers.handleResume}
        />
      </div>
    </SimpleEnvironmentBackground>
  )
}
