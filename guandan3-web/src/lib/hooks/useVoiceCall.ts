import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { devError } from '@/lib/utils/devLog'

interface VoiceCallState {
  isCalling: boolean
  isInCall: boolean
  isMuted: boolean
  isSpeakerEnabled: boolean
  error: string | null
  participants: string[]
  localStream: MediaStream | null
  remoteStreams: MediaStream[]
}

interface VoiceCallOptions {
  roomId: string
  userId: string
  onIncomingCall?: (callerId: string) => void
  onCallEnded?: () => void
  onParticipantJoined?: (participantId: string) => void
  onParticipantLeft?: (participantId: string) => void
}

export function useVoiceCall({
  roomId,
  userId,
  onIncomingCall,
  onCallEnded,
  onParticipantJoined,
  onParticipantLeft
}: VoiceCallOptions) {
  const [state, setState] = useState<VoiceCallState>({
    isCalling: false,
    isInCall: false,
    isMuted: false,
    isSpeakerEnabled: true,
    error: null,
    participants: [],
    localStream: null,
    remoteStreams: []
  })

  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isCallActiveRef = useRef(false) // 用于防止重复调用

  const updateState = useCallback((updates: Partial<VoiceCallState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const getLocalStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: false
      })
      localStreamRef.current = stream
      updateState({ localStream: stream })
      return stream
    } catch (error) {
      devError('获取麦克风权限失败:', error)
      throw new Error('无法访问麦克风，请检查权限设置')
    }
  }, [])

  const createPeerConnection = useCallback(async (peerId: string): Promise<RTCPeerConnection> => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    })

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        supabase.channel(`voice:${roomId}`).send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            candidate: event.candidate,
            targetId: peerId,
            senderId: userId
          }
        })
      }
    }

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0]
      if (remoteStream) {
        remoteStreamsRef.current.set(peerId, remoteStream)
        updateState({ remoteStreams: Array.from(remoteStreamsRef.current.values()) })
        onParticipantJoined?.(peerId)
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peerConnectionsRef.current.delete(peerId)
        remoteStreamsRef.current.delete(peerId)
        updateState({ remoteStreams: Array.from(remoteStreamsRef.current.values()) })
        onParticipantLeft?.(peerId)
      }
    }

    peerConnectionsRef.current.set(peerId, pc)
    return pc
  }, [roomId, userId, onParticipantJoined, onParticipantLeft])

  const handleOffer = useCallback(async (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
    try {
      const pc = await createPeerConnection(data.senderId)
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      supabase.channel(`voice:${roomId}`).send({
        type: 'broadcast',
        event: 'answer',
        payload: {
          answer,
          targetId: data.senderId,
          senderId: userId
        }
      })
    } catch (error) {
      devError('处理 offer 失败:', error)
    }
  }, [roomId, userId, createPeerConnection])

  const handleAnswer = useCallback(async (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
    try {
      const pc = peerConnectionsRef.current.get(data.senderId)
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
      }
    } catch (error) {
      devError('处理 answer 失败:', error)
    }
  }, [])

  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
    try {
      const pc = peerConnectionsRef.current.get(data.senderId)
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      }
    } catch (error) {
      devError('添加 ICE candidate 失败:', error)
    }
  }, [])

  const startCall = useCallback(async () => {
    try {
      isCallActiveRef.current = true
      updateState({ isCalling: true, error: null })
      await getLocalStream()

      channelRef.current = supabase.channel(`voice:${roomId}`)
      channelRef.current
        .on('broadcast', { event: 'offer' }, (payload: any) => handleOffer(payload.payload))
        .on('broadcast', { event: 'answer' }, (payload: any) => handleAnswer(payload.payload))
        .on('broadcast', { event: 'ice-candidate' }, (payload: any) => handleIceCandidate(payload.payload))
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            updateState({ participants: [], isInCall: true, isCalling: false })
          }
        })
    } catch (error) {
      devError('开始通话失败:', error)
      isCallActiveRef.current = false
      updateState({ isCalling: false, error: error instanceof Error ? error.message : '开始通话失败' })
    }
  }, [roomId, getLocalStream, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate, updateState])

  // 使用 ref 来避免 onCallEnded 依赖变化导致 useCallback 重新创建
  const onCallEndedRef = useRef(onCallEnded)
  useEffect(() => {
    onCallEndedRef.current = onCallEnded
  }, [onCallEnded])

  const endCall = useCallback(() => {
    // 防止重复调用
    if (!isCallActiveRef.current) {
      return
    }

    isCallActiveRef.current = false

    localStreamRef.current?.getTracks().forEach(track => track.stop())
    localStreamRef.current = null

    peerConnectionsRef.current.forEach(pc => pc.close())
    peerConnectionsRef.current.clear()

    remoteStreamsRef.current.clear()

    channelRef.current?.unsubscribe()
    channelRef.current = null

    updateState({
      isInCall: false,
      isCalling: false,
      participants: [],
      localStream: null,
      remoteStreams: [],
      error: null
    })

    // 使用 ref 而不是直接调用，避免依赖问题
    onCallEndedRef.current?.()
  }, [updateState])

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        updateState({ isMuted: !audioTrack.enabled })
      }
    }
  }, [updateState])

  const toggleSpeaker = useCallback(() => {
    setState(prev => ({ ...prev, isSpeakerEnabled: !prev.isSpeakerEnabled }))
  }, [])

  useEffect(() => {
    return () => {
      endCall()
    }
  }, [endCall])

  return {
    ...state,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker
  }
}
