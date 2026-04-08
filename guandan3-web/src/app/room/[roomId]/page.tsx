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
import { Z_INDEX, FIXED_POSITION } from '@/lib/constants/z-index'

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

  // 从环境变量读取主题配置
  const theme = (process.env.NEXT_PUBLIC_THEME as 'classic' | 'poker') || 'classic'

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

  // ============ 事件处理 ============（必须在AI之前声明）
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

  // ============ AI 调试 ============
  const { debugLog, addDebugLog, agentStatuses } = useRoomAI(
    roomId,
    derivedState.isOwner,
    gameState.gameStatus,
    gameState.currentSeat,
    gameState.turnNo,
    gameState.members,
    localState.difficulty,
    gameState.currentRoom?.mode,  // 传递房间模式
    handlers.selectedCardIds  // 传递选中的卡牌ID
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

  // ============ 音效逻辑 ============
  const playSoundRef = useRef(playSound)

  // 使用 useEffect 更新 ref，避免在渲染期间直接修改
  useEffect(() => {
    playSoundRef.current = playSound
  }, [playSound])

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
  // 练习模式：游戏创建后状态为 'deal'，需要调用 start_game 将状态转为 'playing'
  // 条件：房间模式为 pve1v3、游戏状态为 'deal'、房间已加载、用户是房主
  const autoStartStartedRef = useRef(false)
  useEffect(() => {
    // 调试日志
    logger.debug('[AutoStart] 条件检查:', {
      mode: gameState.currentRoom?.mode,
      gameStatus: gameState.gameStatus,
      roomLoaded,
      isOwner: derivedState.isOwner,
      started: autoStartStartedRef.current,
      gameId: gameState.gameId,
    })

    const shouldAutoStart =
      gameState.currentRoom?.mode === 'pve1v3' &&
      gameState.gameStatus === 'deal' &&
      roomLoaded &&
      derivedState.isOwner &&
      !autoStartStartedRef.current

    if (shouldAutoStart) {
      logger.debug('[AutoStart] 触发练习模式自动开始')
      autoStartStartedRef.current = true
      const timer = setTimeout(async () => {
        try {
          await gameState.startGameRef.current(roomId)
          logger.debug('[AutoStart] startGame 调用完成')
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
    roomId,
    gameState.startGameRef,
  ])

  // ============ 渲染 ============
  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', color: 'black', overflow: 'hidden', fontFamily: 'sans-serif', position: 'relative' }}>
        {toastView}

        {/* 实时连接状态 */}
        {!realtimeHealthy && (
          <div
            data-testid="room-realtime-banner"
            style={{
              backgroundColor: '#fef3c7',
              color: '#78350f',
              borderBottom: '1px solid #fcd34d',
              padding: '0.5rem 1rem',
              borderRadius: '0 0 8px 8px',
            }}
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

        {/* 调试按钮 - 使用预定义的位置和层级 */}
        <RippleEffect className="relative inline-block">
          <button
            onClick={() => localState.setIsDebugVisible((prev) => !prev)}
            style={{
              position: 'fixed',
              bottom: `${FIXED_POSITION.BOTTOM_SPACING.HIGHEST}px`,
              left: `${FIXED_POSITION.LEFT_SPACING.FIRST}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              cursor: 'pointer',
              zIndex: Z_INDEX.DEBUG_TOGGLE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
            }}
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
        <main
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'auto 1fr auto',
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 0,
          }}
        >
          {/* 其他玩家座位 */}
          <PlayerSeatsGrid
            roomStatus={gameState.currentRoom?.status}
            memoizedPlayerAvatars={memoizedPlayerAvatars}
          />

          {/* 牌桌区域（中间） */}
          <div
            style={{
              gridColumn: '2',
              gridRow: '2',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 0,
              padding: '0.25rem 0.5rem 1rem 1rem',
            }}
          >
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
