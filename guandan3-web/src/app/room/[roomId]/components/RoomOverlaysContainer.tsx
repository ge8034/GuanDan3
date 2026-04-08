/**
 * 房间覆盖层容器组件
 *
 * 集中管理所有覆盖层、特效和面板组件
 */

import { memo } from 'react'
import { GameOverOverlay } from '../GameOverOverlay'
import { GamePausedOverlay } from '../GamePausedOverlay'
import { GameDealAnimation } from '@/components/animations/GameDealAnimation.lazy'
import { PlayCardAnimation } from '@/components/animations/PlayCardAnimation.lazy'
import { VictoryEffect } from '@/components/animations/VictoryEffect.lazy'
import { ComboEffect } from '@/components/animations/ComboEffect.lazy'
import { AIStatusPanel } from '../AIStatusPanel.lazy'
import { EnhancedChatBox } from '@/components/chat/EnhancedChatBox.lazy'
import { RoomInvitationPanel } from '@/components/room/RoomInvitationPanel.lazy'
import { VoiceCallPanel } from '@/components/voice/VoiceCallPanel.lazy'
import { GameHintsPanel } from '@/components/game/GameHintsPanel'
import GamePauseResume from '@/components/game/GamePauseResume'
import type { Card } from '@/lib/store/game'
import type { RoomMember } from '@/lib/store/room'
import { FIXED_POSITION } from '@/lib/constants/z-index'

interface RoomOverlaysContainerProps {
  roomId: string
  gameStatus: string
  pausedBy?: string | null
  pausedAt?: Date | null
  pauseReason?: string | null
  isOwner: boolean
  isDebugVisible: boolean
  difficulty: 'easy' | 'medium' | 'hard'
  myMember?: RoomMember
  rankings: number[]
  mySeat: number
  // 动画状态
  showDealAnimation: boolean
  showPlayAnimation: boolean
  showVictoryEffect: boolean
  showComboEffect: boolean
  playAnimationCards: Card[]
  playAnimationFromSeat: number
  playAnimationToSeat: number
  victoryType: 'victory' | 'defeat'
  comboCount: number
  // 性能监控
  fps: number
  networkOnline: boolean
  effectiveType?: string
  // AI 调试
  debugLog: string[]
  currentSeat: number
  turnNo: number
  agentStatuses?: Record<string, { status: string; task?: string }>
  // 回调
  onDealAnimationComplete: () => void
  onPlayAnimationComplete: () => void
  onVictoryEffectComplete: () => void
  onComboEffectComplete: () => void
  onRestart: () => void
  onResume: () => void
}

export const RoomOverlaysContainer = memo(
  function RoomOverlaysContainer({
    roomId,
    gameStatus,
    pausedBy,
    pausedAt,
    pauseReason,
    isOwner,
    isDebugVisible,
    difficulty,
    myMember,
    rankings,
    mySeat,
    showDealAnimation,
    showPlayAnimation,
    showVictoryEffect,
    showComboEffect,
    playAnimationCards,
    playAnimationFromSeat,
    playAnimationToSeat,
    victoryType,
    comboCount,
    fps,
    networkOnline,
    effectiveType,
    debugLog,
    currentSeat,
    turnNo,
    agentStatuses,
    onDealAnimationComplete,
    onPlayAnimationComplete,
    onVictoryEffectComplete,
    onComboEffectComplete,
    onRestart,
    onResume,
  }: RoomOverlaysContainerProps) {
    return (
      <>
        {/* PERFORMANCE MONITOR */}
        {isDebugVisible && (
          <div
            style={{
              position: 'fixed',
              bottom: `${FIXED_POSITION.BOTTOM_SPACING.MIDDLE}px`,
              left: `${FIXED_POSITION.LEFT_SPACING.SECOND}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              fontSize: '0.75rem',
              padding: '0.75rem',
              borderRadius: '8px',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              zIndex: 900,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>性能监控</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>
                FPS:{' '}
                <span
                  style={{
                    color: fps >= 30 ? '#4ade80' : fps >= 20 ? '#facc15' : '#f87171',
                  }}
                >
                  {fps}
                </span>
              </div>
              <div>
                网络:{' '}
                <span style={{ color: networkOnline ? '#4ade80' : '#f87171' }}>
                  {networkOnline ? '在线' : '离线'}
                </span>
              </div>
              {effectiveType && <div>连接类型: {effectiveType}</div>}
            </div>
          </div>
        )}

        <EnhancedChatBox
          roomId={roomId}
          userId={myMember?.uid || 'guest'}
          userName={myMember ? `座位 ${myMember.seat_no}` : '游客'}
        />

        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '1rem',
            zIndex: 800,
          }}
        >
          <VoiceCallPanel roomId={roomId} />
        </div>

        <GameHintsPanel />

        {isOwner && (
          <div
            style={{
              position: 'fixed',
              bottom: `${FIXED_POSITION.BOTTOM_SPACING.LOWEST}px`,
              left: `${FIXED_POSITION.LEFT_SPACING.SECOND}px`,
              zIndex: 700,
            }}
          >
            <RoomInvitationPanel roomId={roomId} isOwner={isOwner} />
          </div>
        )}

        <GameOverOverlay
          visible={gameStatus === 'finished'}
          rankings={rankings}
          mySeat={mySeat}
          isOwner={isOwner}
          onRestart={onRestart}
        />

        <GamePausedOverlay
          visible={gameStatus === 'paused'}
          pausedBy={pausedBy}
          pausedAt={pausedAt}
          pauseReason={pauseReason}
          onResume={onResume}
        />

        <GamePauseResume roomId={roomId} isOwner={isOwner} />

        <GameDealAnimation
          visible={showDealAnimation}
          onComplete={onDealAnimationComplete}
          dealSpeed={50}
        />

        <PlayCardAnimation
          visible={showPlayAnimation}
          cards={playAnimationCards}
          fromSeat={playAnimationFromSeat}
          toSeat={playAnimationToSeat}
          mySeat={mySeat}
          onComplete={onPlayAnimationComplete}
          duration={0.6}
        />

        <VictoryEffect
          visible={showVictoryEffect}
          type={victoryType}
          onComplete={onVictoryEffectComplete}
          duration={4000}
        />

        <ComboEffect
          visible={showComboEffect}
          comboCount={comboCount}
          onComplete={onComboEffectComplete}
          duration={2000}
        />

        <AIStatusPanel
          visible={isDebugVisible}
          logs={debugLog}
          currentTurnSeat={currentSeat}
          turnNo={turnNo}
          agentStatuses={agentStatuses}
          difficulty={difficulty}
        />
      </>
    )
  }
)
