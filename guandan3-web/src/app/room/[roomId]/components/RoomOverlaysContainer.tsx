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
          <div className="fixed bottom-20 left-20 z-[9999] bg-black/80 text-white text-xs p-3 rounded-lg backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="font-bold mb-2">性能监控</div>
            <div className="space-y-1">
              <div>
                FPS:{' '}
                <span
                  className={
                    fps >= 30
                      ? 'text-green-400'
                      : fps >= 20
                        ? 'text-yellow-400'
                        : 'text-red-400'
                  }
                >
                  {fps}
                </span>
              </div>
              <div>
                网络:{' '}
                <span
                  className={networkOnline ? 'text-green-400' : 'text-red-400'}
                >
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

        <div className="fixed top-20 right-4 z-50">
          <VoiceCallPanel roomId={roomId} />
        </div>

        <GameHintsPanel />

        {isOwner && (
          <div className="fixed bottom-4 left-20 z-40">
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
