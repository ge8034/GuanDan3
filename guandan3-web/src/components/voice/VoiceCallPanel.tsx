'use client'

import { useEffect, useRef } from 'react'
import { useVoiceCall } from '@/lib/hooks/useVoiceCall'
import { VoiceCallControls } from './VoiceCallControls'
import { useAuthStore } from '@/lib/store/auth'

import { logger } from '@/lib/utils/logger'
interface VoiceCallPanelProps {
  roomId: string
}

export default function VoiceCallPanel({ roomId }: VoiceCallPanelProps) {
  const { user } = useAuthStore()
  const userId = user?.id || ''

  const {
    isCalling,
    isInCall,
    isMuted,
    isSpeakerEnabled,
    error,
    participants,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    remoteStreams
  } = useVoiceCall({
    roomId,
    userId,
    onIncomingCall: (callerId) => {
      logger.debug('收到来电:', callerId)
    },
    onCallEnded: () => {
      logger.debug('通话结束')
    },
    onParticipantJoined: (participantId) => {
      logger.debug('参与者加入:', participantId)
    },
    onParticipantLeft: (participantId) => {
      logger.debug('参与者离开:', participantId)
    }
  })

  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())
  const processedStreamsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // 创建当前 ref 值的快照，避免 cleanup 函数中使用过时的 ref
    const currentRemoteRefs = remoteAudioRefs.current
    const currentProcessedStreams = processedStreamsRef.current

    remoteStreams.forEach((stream, index) => {
      const streamId = `${index}-${stream.id}`
      // 避免重复处理同一个流
      if (currentProcessedStreams.has(streamId)) {
        return
      }

      const audioElement = document.createElement('audio')
      audioElement.srcObject = stream
      audioElement.autoplay = true
      audioElement.muted = false
      currentRemoteRefs.set(streamId, audioElement)
      currentProcessedStreams.add(streamId)
    })

    return () => {
      currentRemoteRefs.forEach(audio => {
        audio.pause()
        audio.srcObject = null
      })
      currentRemoteRefs.clear()
      currentProcessedStreams.clear()
    }
  }, [remoteStreams]) // 依赖整个 remoteStreams 数组，但内部使用快照避免闭包问题

  return (
    <div className="flex items-center gap-4">
      <VoiceCallControls
        isInCall={isInCall}
        isCalling={isCalling}
        isMuted={isMuted}
        isSpeakerEnabled={isSpeakerEnabled}
        onStartCall={startCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        error={error}
        participantCount={participants.length}
      />

      <audio ref={localAudioRef} autoPlay playsInline muted />
    </div>
  )
}
