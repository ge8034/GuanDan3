'use client'

import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VoiceCallControlsProps {
  isInCall: boolean
  isCalling: boolean
  isMuted: boolean
  isSpeakerEnabled: boolean
  onStartCall: () => void
  onEndCall: () => void
  onToggleMute: () => void
  onToggleSpeaker: () => void
  error?: string | null
  participantCount?: number
}

export function VoiceCallControls({
  isInCall,
  isCalling,
  isMuted,
  isSpeakerEnabled,
  onStartCall,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  error,
  participantCount = 0
}: VoiceCallControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
          {error}
        </div>
      )}

      {!isInCall && !isCalling && (
        <Button
          onClick={onStartCall}
          size="sm"
          variant="outline"
          className="gap-2"
        >
          <Phone className="w-4 h-4" />
          语音通话
        </Button>
      )}

      {isCalling && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          正在连接...
        </div>
      )}

      {isInCall && (
        <div className="flex items-center gap-2">
          <div className="text-xs text-text-secondary bg-surface px-2 py-1 rounded">
            {participantCount} 人通话中
          </div>

          <Button
            onClick={onToggleMute}
            size="sm"
            variant={isMuted ? 'danger' : 'outline'}
            className="gap-2"
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          <Button
            onClick={onToggleSpeaker}
            size="sm"
            variant={isSpeakerEnabled ? 'outline' : 'danger'}
            className="gap-2"
          >
            {isSpeakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          <Button
            onClick={onEndCall}
            size="sm"
            variant="danger"
            className="gap-2"
          >
            <PhoneOff className="w-4 h-4" />
            挂断
          </Button>
        </div>
      )}
    </div>
  )
}
