export interface ReconnectConfig {
  maxRetries: number
  initialDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitter: boolean
  enableExponentialBackoff: boolean
}

export interface ReconnectStats {
  attemptCount: number
  successfulConnections: number
  failedConnections: number
  totalDowntime: number
  averageReconnectTime: number
  lastReconnectTime: number
  lastDisconnectTime: number
}

export interface ReconnectState {
  isReconnecting: boolean
  currentAttempt: number
  nextRetryTime: number
  reason: string | null
}

export class WebSocketReconnectManager {
  private static instance: WebSocketReconnectManager
  private config: ReconnectConfig
  private stats: ReconnectStats
  private state: ReconnectState
  private reconnectTimeout: NodeJS.Timeout | null = null
  private onReconnectAttempt?: (attempt: number) => void
  private onReconnectSuccess?: () => void
  private onReconnectFailed?: (error: Error) => void
  private onMaxRetriesReached?: () => void
  private reconnectHistory: number[] = []

  private constructor(config: Partial<ReconnectConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 10,
      initialDelay: config.initialDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      backoffMultiplier: config.backoffMultiplier || 2,
      jitter: config.jitter !== false,
      enableExponentialBackoff: config.enableExponentialBackoff !== false
    }

    this.stats = {
      attemptCount: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalDowntime: 0,
      averageReconnectTime: 0,
      lastReconnectTime: 0,
      lastDisconnectTime: 0
    }

    this.state = {
      isReconnecting: false,
      currentAttempt: 0,
      nextRetryTime: 0,
      reason: null
    }
  }

  static getInstance(config?: Partial<ReconnectConfig>): WebSocketReconnectManager {
    if (!WebSocketReconnectManager.instance) {
      WebSocketReconnectManager.instance = new WebSocketReconnectManager(config)
    }
    return WebSocketReconnectManager.instance
  }

  startReconnect(reason: string): void {
    if (this.state.isReconnecting) {
      console.warn('Reconnection already in progress')
      return
    }

    console.log(`Starting reconnection process. Reason: ${reason}`)

    this.state.isReconnecting = true
    this.state.reason = reason
    this.state.currentAttempt = 0
    this.stats.lastDisconnectTime = Date.now()

    this.scheduleNextRetry()
  }

  stopReconnect(): void {
    if (!this.state.isReconnecting) {
      return
    }

    console.log('Stopping reconnection process')

    this.clearReconnectTimeout()
    this.state.isReconnecting = false
    this.state.currentAttempt = 0
    this.state.reason = null
  }

  recordSuccess(): void {
    if (!this.state.isReconnecting) {
      return
    }

    const now = Date.now()
    const reconnectTime = now - this.stats.lastDisconnectTime

    this.stats.successfulConnections++
    this.stats.attemptCount++
    this.stats.lastReconnectTime = now
    this.stats.totalDowntime += reconnectTime

    this.reconnectHistory.push(reconnectTime)
    if (this.reconnectHistory.length > 50) {
      this.reconnectHistory.shift()
    }

    const avgReconnectTime = this.reconnectHistory.reduce((a, b) => a + b, 0) / this.reconnectHistory.length
    this.stats.averageReconnectTime = avgReconnectTime

    console.log(`Reconnection successful. Time: ${reconnectTime}ms, Average: ${avgReconnectTime.toFixed(2)}ms`)

    this.stopReconnect()

    if (this.onReconnectSuccess) {
      this.onReconnectSuccess()
    }
  }

  recordFailure(error: Error): void {
    if (!this.state.isReconnecting) {
      return
    }

    this.stats.failedConnections++
    this.stats.attemptCount++

    console.error(`Reconnection attempt ${this.state.currentAttempt} failed:`, error)

    if (this.onReconnectFailed) {
      this.onReconnectFailed(error)
    }

    if (this.state.currentAttempt >= this.config.maxRetries) {
      console.error('Max reconnection attempts reached')
      this.stopReconnect()

      if (this.onMaxRetriesReached) {
        this.onMaxRetriesReached()
      }
    } else {
      this.scheduleNextRetry()
    }
  }

  onAttempt(callback: (attempt: number) => void): void {
    this.onReconnectAttempt = callback
  }

  onSuccess(callback: () => void): void {
    this.onReconnectSuccess = callback
  }

  onFailure(callback: (error: Error) => void): void {
    this.onReconnectFailed = callback
  }

  onMaxRetries(callback: () => void): void {
    this.onMaxRetriesReached = callback
  }

  getStats(): ReconnectStats {
    return { ...this.stats }
  }

  getState(): ReconnectState {
    return { ...this.state }
  }

  getHealthStatus(): {
    healthy: boolean
    status: 'connected' | 'reconnecting' | 'disconnected'
    message: string
  } {
    if (this.state.isReconnecting) {
      return {
        healthy: false,
        status: 'reconnecting',
        message: `重连中 (${this.state.currentAttempt}/${this.config.maxRetries})`
      }
    }

    if (this.stats.successfulConnections === 0) {
      return {
        healthy: false,
        status: 'disconnected',
        message: '未连接'
      }
    }

    const successRate = this.stats.successfulConnections / this.stats.attemptCount
    if (successRate < 0.5) {
      return {
        healthy: false,
        status: 'disconnected',
        message: '连接不稳定'
      }
    }

    return {
      healthy: true,
      status: 'connected',
      message: '连接正常'
    }
  }

  updateConfig(config: Partial<ReconnectConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('Reconnect config updated:', this.config)
  }

  reset(): void {
    this.stopReconnect()
    this.stats = {
      attemptCount: 0,
      successfulConnections: 0,
      failedConnections: 0,
      totalDowntime: 0,
      averageReconnectTime: 0,
      lastReconnectTime: 0,
      lastDisconnectTime: 0
    }
    this.reconnectHistory = []
    console.log('Reconnect manager reset')
  }

  private scheduleNextRetry(): void {
    this.clearReconnectTimeout()

    this.state.currentAttempt++
    const delay = this.calculateRetryDelay(this.state.currentAttempt)
    this.state.nextRetryTime = Date.now() + delay

    console.log(`Scheduling reconnection attempt ${this.state.currentAttempt} in ${delay}ms`)

    if (this.onReconnectAttempt) {
      this.onReconnectAttempt(this.state.currentAttempt)
    }

    this.reconnectTimeout = setTimeout(() => {
      this.triggerReconnect()
    }, delay)
  }

  private triggerReconnect(): void {
    console.log(`Triggering reconnection attempt ${this.state.currentAttempt}`)

    this.reconnectTimeout = null

    if (this.onReconnectAttempt) {
      this.onReconnectAttempt(this.state.currentAttempt)
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private calculateRetryDelay(attempt: number): number {
    let delay: number

    if (this.config.enableExponentialBackoff) {
      delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt - 1)
    } else {
      delay = this.config.initialDelay + (attempt - 1) * 1000
    }

    delay = Math.min(delay, this.config.maxDelay)

    if (this.config.jitter) {
      const jitterAmount = delay * 0.1
      delay += (Math.random() - 0.5) * jitterAmount
    }

    return Math.max(delay, 0)
  }

  getEstimatedReconnectTime(): number {
    if (!this.state.isReconnecting) {
      return 0
    }

    return this.state.nextRetryTime - Date.now()
  }

  getSuccessRate(): number {
    if (this.stats.attemptCount === 0) {
      return 0
    }

    return this.stats.successfulConnections / this.stats.attemptCount
  }

  getAverageDowntime(): number {
    if (this.stats.successfulConnections === 0) {
      return 0
    }

    return this.stats.totalDowntime / this.stats.successfulConnections
  }
}

export const webSocketReconnectManager = WebSocketReconnectManager.getInstance()
