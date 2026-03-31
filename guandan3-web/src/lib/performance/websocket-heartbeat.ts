import { logger } from '@/lib/utils/logger'

export interface HeartbeatConfig {
  interval: number
  timeout: number
  maxMissedBeats: number
  retryInterval: number
  maxRetries: number
}

export interface HeartbeatStats {
  sent: number
  received: number
  missed: number
  lastSent: number
  lastReceived: number
  averageLatency: number
  connectionUptime: number
}

export class WebSocketHeartbeat {
  private static instance: WebSocketHeartbeat
  private config: HeartbeatConfig
  private stats: HeartbeatStats
  private heartbeatInterval: NodeJS.Timeout | null = null
  private timeoutInterval: NodeJS.Timeout | null = null
  private retryInterval: NodeJS.Timeout | null = null
  private retryCount = 0
  private isRunning = false
  private onHeartbeatSend?: () => void
  private onHeartbeatReceive?: () => void
  private latencyHistory: number[] = []
  private connectionStartTime: number = 0
  private timeoutCallback?: () => void
  private reconnectCallback?: () => void
  private maxRetriesCallback?: () => void

  private constructor(config: Partial<HeartbeatConfig> = {}) {
    this.config = {
      interval: config.interval || 30000,
      timeout: config.timeout || 10000,
      maxMissedBeats: config.maxMissedBeats || 3,
      retryInterval: config.retryInterval || 5000,
      maxRetries: config.maxRetries || 5
    }

    this.stats = {
      sent: 0,
      received: 0,
      missed: 0,
      lastSent: 0,
      lastReceived: 0,
      averageLatency: 0,
      connectionUptime: 0
    }
  }

  static getInstance(config?: Partial<HeartbeatConfig>): WebSocketHeartbeat {
    if (!WebSocketHeartbeat.instance) {
      WebSocketHeartbeat.instance = new WebSocketHeartbeat(config)
    }
    return WebSocketHeartbeat.instance
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Heartbeat is already running')
      return
    }

    this.isRunning = true
    this.connectionStartTime = Date.now()
    this.startHeartbeat()
    logger.debug('WebSocket heartbeat started')
  }

  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false
    this.clearAllIntervals()
    this.retryCount = 0
    logger.debug('WebSocket heartbeat stopped')
  }

  reset(): void {
    this.stop()
    this.stats = {
      sent: 0,
      received: 0,
      missed: 0,
      lastSent: 0,
      lastReceived: 0,
      averageLatency: 0,
      connectionUptime: 0
    }
    this.latencyHistory = []
    this.retryCount = 0
  }

  onSend(callback: () => void): void {
    this.onHeartbeatSend = callback
  }

  onReceive(callback: () => void): void {
    this.onHeartbeatReceive = callback
  }

  onTimeout(callback: () => void): void {
    this.timeoutCallback = callback
  }

  onReconnect(callback: () => void): void {
    this.reconnectCallback = callback
  }

  onMaxRetriesReached(callback: () => void): void {
    this.maxRetriesCallback = callback
  }

  recordHeartbeatSent(): void {
    if (!this.isRunning) return

    this.stats.sent++
    this.stats.lastSent = Date.now()
    this.startTimeout()

    if (this.onHeartbeatSend) {
      this.onHeartbeatSend()
    }
  }

  recordHeartbeatReceived(): void {
    if (!this.isRunning) return

    this.stats.received++
    this.stats.lastReceived = Date.now()
    this.clearTimeout()
    this.retryCount = 0

    const latency = this.stats.lastReceived - this.stats.lastSent
    this.updateLatency(latency)

    if (this.onHeartbeatReceive) {
      this.onHeartbeatReceive()
    }
  }

  getStats(): HeartbeatStats {
    return {
      ...this.stats,
      connectionUptime: this.isRunning ? Date.now() - this.connectionStartTime : this.stats.connectionUptime
    }
  }

  getHealthStatus(): {
    healthy: boolean
    status: 'connected' | 'unstable' | 'disconnected'
    message: string
  } {
    const now = Date.now()
    const timeSinceLastBeat = now - this.stats.lastReceived

    if (this.stats.received === 0) {
      return {
        healthy: false,
        status: 'disconnected',
        message: '未收到心跳响应'
      }
    }

    if (timeSinceLastBeat > this.config.timeout * this.config.maxMissedBeats) {
      return {
        healthy: false,
        status: 'disconnected',
        message: '连接已断开'
      }
    }

    if (timeSinceLastBeat > this.config.timeout) {
      return {
        healthy: false,
        status: 'unstable',
        message: '连接不稳定'
      }
    }

    return {
      healthy: true,
      status: 'connected',
      message: '连接正常'
    }
  }

  updateConfig(config: Partial<HeartbeatConfig>): void {
    this.config = { ...this.config, ...config }
    logger.debug('Heartbeat config updated:', this.config)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.recordHeartbeatSent()
    }, this.config.interval)
  }

  private startTimeout(): void {
    this.clearTimeout()

    this.timeoutInterval = setTimeout(() => {
      this.handleTimeout()
    }, this.config.timeout)
  }

  private clearTimeout(): void {
    if (this.timeoutInterval) {
      clearTimeout(this.timeoutInterval)
      this.timeoutInterval = null
    }
  }

  private clearAllIntervals(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.clearTimeout()

    if (this.retryInterval) {
      clearInterval(this.retryInterval)
      this.retryInterval = null
    }
  }

  private handleTimeout(): void {
    this.stats.missed++

    const healthStatus = this.getHealthStatus()

    if (healthStatus.status === 'disconnected') {
      logger.warn('Heartbeat timeout, connection lost')
      if (this.timeoutCallback) {
        this.timeoutCallback()
      }
      this.startReconnect()
    } else if (healthStatus.status === 'unstable') {
      logger.warn('Heartbeat timeout, connection unstable')
    }
  }

  private startReconnect(): void {
    if (this.retryCount >= this.config.maxRetries) {
      logger.error('Max reconnection attempts reached')
      if (this.maxRetriesCallback) {
        this.maxRetriesCallback()
      }
      return
    }

    this.retryCount++
    logger.debug(`Attempting reconnection (${this.retryCount}/${this.config.maxRetries})`)

    this.retryInterval = setInterval(() => {
      if (this.reconnectCallback) {
        this.reconnectCallback()
      }
    }, this.config.retryInterval)
  }

  private updateLatency(latency: number): void {
    this.latencyHistory.push(latency)

    if (this.latencyHistory.length > 100) {
      this.latencyHistory.shift()
    }

    const sum = this.latencyHistory.reduce((a, b) => a + b, 0)
    this.stats.averageLatency = sum / this.latencyHistory.length
  }
}

export const webSocketHeartbeat = WebSocketHeartbeat.getInstance()
