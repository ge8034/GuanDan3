import { useRef, useCallback } from 'react'
import { logger } from '@/lib/utils/logger'

/**
 * 音效类型
 *
 * 支持的游戏音效类型：
 * - `turn`: 轮到玩家出牌时的提示音
 * - `play`: 玩家出牌时的音效
 * - `win`: 胜利时的音效
 * - `lose`: 失败时的音效
 * - `bomb`: 炸弹音效
 * - `straight`: 顺子音效
 */
export type SoundType = 'turn' | 'play' | 'win' | 'lose' | 'bomb' | 'straight'

/**
 * 返回值类型
 */
interface UseSoundReturn {
  playSound: (type: SoundType) => void
}

/**
 * 音效播放 Hook
 *
 * 使用 Web Audio API 生成游戏音效，无需外部音频文件。
 * 支持轮到你了、出牌、胜利、失败等音效。
 *
 * @returns 音效播放方法
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const { playSound } = useSound()
 *
 *   const handleMyTurn = () => {
 *     playSound('turn')  // 播放"轮到你"提示音
 *   }
 *
 *   const handlePlayCard = () => {
 *     playSound('play')  // 播放出牌音效
 *   }
 *
 *   const handleGameEnd = (isWinner: boolean) => {
 *     playSound(isWinner ? 'win' : 'lose')
 *   }
 *
 *   return <button onClick={handleMyTurn}>出牌</button>
 * }
 * ```
 *
 * @remarks
 * 音效说明：
 * - `turn`: 柔和的"Ding"声，正弦波快速衰减
 * - `play`: 卡牌拍击声，白噪声爆发
 * - `win`: 大三和弦琶音 (C-E-G-C)
 * - `lose`: 减三和弦下行 (C-Eb-Gb-A)
 *
 * 注意事项：
 * - AudioContext 首次使用时延迟初始化
 * - 自动处理浏览器自动播放策略
 * - 静默处理播放失败（用户未交互等）
 */
export const useSound = (): UseSoundReturn => {
  const audioContextRef = useRef<AudioContext | null>(null)

  /**
   * 播放音效
   *
   * @param type - 音效类型
   */
  const playSound = useCallback((type: SoundType) => {
    try {
      if (!audioContextRef.current) {
        // Lazy init
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
        }
      }

      const ctx = audioContextRef.current
      if (!ctx) return
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }

      const now = ctx.currentTime
      const gainNode = ctx.createGain()
      gainNode.connect(ctx.destination)

      switch (type) {
        case 'turn':
          // Soft "Ding" - Sine wave with quick decay
          const oscTurn = ctx.createOscillator()
          oscTurn.type = 'sine'
          oscTurn.frequency.setValueAtTime(880, now) // A5
          oscTurn.connect(gainNode)

          gainNode.gain.setValueAtTime(0, now)
          gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05)
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

          oscTurn.start(now)
          oscTurn.stop(now + 0.5)
          break

        case 'play':
          // Card Snap - White noise burst + high pitch short tone
          const noiseLen = ctx.sampleRate * 0.1
          const noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate)
          const noiseData = noiseBuffer.getChannelData(0)
          for (let i = 0; i < noiseLen; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.5 // Reduce volume
          }
          const noiseSrc = ctx.createBufferSource()
          noiseSrc.buffer = noiseBuffer

          const noiseFilter = ctx.createBiquadFilter()
          noiseFilter.type = 'lowpass'
          noiseFilter.frequency.setValueAtTime(1200, now)

          noiseSrc.connect(noiseFilter)
          noiseFilter.connect(gainNode)

          gainNode.gain.setValueAtTime(0.5, now)
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08)

          noiseSrc.start(now)
          break

        case 'win':
          // Major Chord Arpeggio (C-E-G-C)
          ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const osc = ctx.createOscillator()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, now + i * 0.1)

            const g = ctx.createGain()
            g.connect(ctx.destination)
            g.gain.setValueAtTime(0, now + i * 0.1)
            g.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05)
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.8)

            osc.connect(g)
            osc.start(now + i * 0.1)
            osc.stop(now + i * 0.1 + 0.8)
          })
          break

        case 'lose':
          // Diminished Chord (C-Eb-Gb-A)
          ;[523.25, 622.25, 739.99, 880]
            .reverse()
            .forEach((freq, i) => {
              const osc = ctx.createOscillator()
              osc.type = 'sawtooth'
              osc.frequency.setValueAtTime(freq, now + i * 0.15)

              const g = ctx.createGain()
              g.connect(ctx.destination)
              g.gain.setValueAtTime(0, now + i * 0.15)
              g.gain.linearRampToValueAtTime(0.1, now + i * 0.15 + 0.05)
              g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 1.0)

              osc.connect(g)
              osc.start(now + i * 0.15)
              osc.stop(now + i * 0.15 + 1.0)
            })
          break

        case 'bomb':
          // Bomb - Deep explosion sound
          const bombOsc = ctx.createOscillator()
          bombOsc.type = 'sawtooth'
          bombOsc.frequency.setValueAtTime(150, now)
          bombOsc.frequency.exponentialRampToValueAtTime(50, now + 0.3)
          bombOsc.connect(gainNode)

          gainNode.gain.setValueAtTime(0, now)
          gainNode.gain.linearRampToValueAtTime(0.4, now + 0.05)
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

          bombOsc.start(now)
          bombOsc.stop(now + 0.5)
          break

        case 'straight':
          // Straight - Rising scale
          ;[523.25, 587.33, 659.25, 698.46, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + i * 0.08)

            const g = ctx.createGain()
            g.connect(ctx.destination)
            g.gain.setValueAtTime(0, now + i * 0.08)
            g.gain.linearRampToValueAtTime(0.15, now + i * 0.08 + 0.03)
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3)

            osc.connect(g)
            osc.start(now + i * 0.08)
            osc.stop(now + i * 0.08 + 0.3)
          })
          break
      }
    } catch (e) {
      logger.warn('Audio play failed:', e)
    }
  }, [])

  return { playSound }
}
