'use client'

import { useEffect, useRef } from 'react'
import { useVoiceCall } from '@/lib/hooks/useVoiceCall'
import { VoiceCallControls } from './VoiceCallControls'
import { useAuthStore } from '@/lib/store/auth'

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
      console.log('收到来电:', callerId)
    },
    onCallEnded: () => {
      console.log('通话结束')
    },
    onParticipantJoined: (participantId) => {
      console.log('参与者加入:', participantId)
    },
    onParticipantLeft: (participantId) => {
      console.log('参与者离开:', participantId)
    }
  })

  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  useEffect(() => {
    remoteStreams.forEach((stream, index) => {
      const audioElement = document.createElement('audio')
      audioElement.srcObject = stream
      audioElement.autoplay = true
      audioElement.muted = false
      remoteAudioRefs.current.set(index.toString(), audioElement)
    })

    return () => {
      const currentRefs = remoteAudioRefs.current
      currentRefs.forEach(audio => {
        audio.pause()
        audio.srcObject = null
      })
      currentRefs.clear()
    }
  }, [remoteStreams])

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
