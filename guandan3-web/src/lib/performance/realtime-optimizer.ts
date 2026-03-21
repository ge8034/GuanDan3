export interface RealtimeConnection {
  id: string
  channel: string
  status: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastUsed: number
  messageCount: number
  reconnectAttempts: number
}

export interface RealtimeMetrics {
  totalConnections: number
  activeConnections: number
  totalMessages: number
  averageLatency: number
  reconnectRate: number
  errorRate: number
}

export interface BatchMessage {
  id: string
  channel: string
  payload: any
  timestamp: number
}

class RealtimeOptimizer {
  private connections: Map<string, RealtimeConnection> = new Map()
  private messageQueue: Map<string, BatchMessage[]> = new Map()
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private metrics: RealtimeMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    totalMessages: 0,
    averageLatency: 0,
    reconnectRate: 0,
    errorRate: 0
  }
  private latencyHistory: number[] = []
  private reconnectAttempts: number = 0
  private errorCount: number = 0
  private maxLatencyHistory: number = 100

  private readonly BATCH_DELAY = 100
  private readonly MAX_BATCH_SIZE = 10
  private readonly MAX_IDLE_TIME = 300000
  private readonly MAX_RECONNECT_ATTEMPTS = 5
  private readonly RECONNECT_DELAY_BASE = 1000

  registerConnection(connectionId: string, channel: string): RealtimeConnection {
    const connection: RealtimeConnection = {
      id: connectionId,
      channel,
      status: 'connecting',
      lastUsed: Date.now(),
      messageCount: 0,
      reconnectAttempts: 0
    }

    this.connections.set(connectionId, connection)
    this.metrics.totalConnections++
    this.metrics.activeConnections++

    return connection
  }

  updateConnectionStatus(connectionId: string, status: RealtimeConnection['status']) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.status = status
    connection.lastUsed = Date.now()

    if (status === 'connected') {
      this.metrics.activeConnections++
    } else if (status === 'disconnected' || status === 'error') {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1)
    }
  }

  recordMessage(connectionId: string, latency?: number) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.messageCount++
    connection.lastUsed = Date.now()
    this.metrics.totalMessages++

    if (latency !== undefined) {
      this.latencyHistory.push(latency)
      if (this.latencyHistory.length > this.maxLatencyHistory) {
        this.latencyHistory.shift()
      }
      this.updateAverageLatency()
    }
  }

  recordReconnectAttempt(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.reconnectAttempts++
    this.reconnectAttempts++
    this.updateReconnectRate()
  }

  recordError(connectionId: string) {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    this.errorCount++
    this.updateErrorRate()
  }

  private updateAverageLatency() {
    if (this.latencyHistory.length === 0) {
      this.metrics.averageLatency = 0
      return
    }

    const sum = this.latencyHistory.reduce((acc, val) => acc + val, 0)
    this.metrics.averageLatency = sum / this.latencyHistory.length
  }

  private updateReconnectRate() {
    if (this.metrics.totalConnections === 0) {
      this.metrics.reconnectRate = 0
      return
    }
    this.metrics.reconnectRate = this.reconnectAttempts / this.metrics.totalConnections
  }

  private updateErrorRate() {
    if (this.metrics.totalMessages === 0) {
      this.metrics.errorRate = 0
      return
    }
    this.metrics.errorRate = this.errorCount / this.metrics.totalMessages
  }

  batchMessage(channel: string, message: BatchMessage): Promise<void> {
    return new Promise((resolve) => {
      const queue = this.messageQueue.get(channel) || []
      queue.push(message)
      this.messageQueue.set(channel, queue)

      if (queue.length >= this.MAX_BATCH_SIZE) {
        this.flushBatch(channel).then(() => resolve())
      } else {
        const existingTimer = this.batchTimers.get(channel)
        if (existingTimer) {
          clearTimeout(existingTimer)
        }

        const timer = setTimeout(() => {
          this.flushBatch(channel).then(() => resolve())
        }, this.BATCH_DELAY)

        this.batchTimers.set(channel, timer)
      }
    })
  }

  private async flushBatch(channel: string): Promise<void> {
    const queue = this.messageQueue.get(channel)
    if (!queue || queue.length === 0) return

    const messages = [...queue]
    this.messageQueue.set(channel, [])

    const timer = this.batchTimers.get(channel)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(channel)
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 0)
    })
  }

  cleanupIdleConnections(): string[] {
    const now = Date.now()
    const idleConnections: string[] = []

    Array.from(this.connections.entries()).forEach(([id, connection]) => {
      if (now - connection.lastUsed > this.MAX_IDLE_TIME) {
        idleConnections.push(id)
      }
    })

    idleConnections.forEach(id => {
      this.connections.delete(id)
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1)
    })

    return idleConnections
  }

  shouldReconnect(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    if (!connection) return false

    if (connection.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      return false
    }

    return true
  }

  getReconnectDelay(connectionId: string): number {
    const connection = this.connections.get(connectionId)
    if (!connection) return this.RECONNECT_DELAY_BASE

    const delay = this.RECONNECT_DELAY_BASE * Math.pow(2, connection.reconnectAttempts)
    const jitter = Math.random() * 0.5 * delay

    return delay + jitter
  }

  getConnection(connectionId: string): RealtimeConnection | undefined {
    return this.connections.get(connectionId)
  }

  getConnectionsByChannel(channel: string): RealtimeConnection[] {
    return Array.from(this.connections.values()).filter(c => c.channel === channel)
  }

  getMetrics(): RealtimeMetrics {
    return { ...this.metrics }
  }

  getDetailedMetrics() {
    return {
      metrics: this.metrics,
      connections: Array.from(this.connections.values()),
      latencyHistory: [...this.latencyHistory],
      reconnectAttempts: this.reconnectAttempts,
      errorCount: this.errorCount
    }
  }

  reset() {
    this.connections.clear()
    this.messageQueue.clear()
    this.batchTimers.forEach(timer => clearTimeout(timer))
    this.batchTimers.clear()
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      averageLatency: 0,
      reconnectRate: 0,
      errorRate: 0
    }
    this.latencyHistory = []
    this.reconnectAttempts = 0
    this.errorCount = 0
  }

  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      connections: Array.from(this.connections.values()),
      latencyHistory: this.latencyHistory,
      timestamp: Date.now()
    }, null, 2)
  }
}

export const realtimeOptimizer = new RealtimeOptimizer()

export function createOptimizedSubscription(
  channel: string,
  connectionId: string,
  subscribe: () => void,
  unsubscribe: () => void,
  onMessage?: (message: any) => void
) {
  const connection = realtimeOptimizer.registerConnection(connectionId, channel)

  const optimizedSubscribe = () => {
    realtimeOptimizer.updateConnectionStatus(connectionId, 'connecting')
    subscribe()
    realtimeOptimizer.updateConnectionStatus(connectionId, 'connected')
  }

  const optimizedUnsubscribe = () => {
    realtimeOptimizer.updateConnectionStatus(connectionId, 'disconnected')
    unsubscribe()
  }

  const optimizedOnMessage = (message: any) => {
    const startTime = performance.now()
    if (onMessage) {
      onMessage(message)
    }
    const latency = performance.now() - startTime
    realtimeOptimizer.recordMessage(connectionId, latency)
  }

  return {
    subscribe: optimizedSubscribe,
    unsubscribe: optimizedUnsubscribe,
    onMessage: optimizedOnMessage,
    connection
  }
}

export function startRealtimeCleanup(interval: number = 60000) {
  return setInterval(() => {
    const cleaned = realtimeOptimizer.cleanupIdleConnections()
    if (cleaned.length > 0) {
      console.log(`[RealtimeOptimizer] Cleaned up ${cleaned.length} idle connections`)
    }
  }, interval)
}

export function getRealtimePerformanceReport() {
  const metrics = realtimeOptimizer.getMetrics()
  const detailed = realtimeOptimizer.getDetailedMetrics()

  return {
    metrics,
    connections: detailed.connections,
    recommendations: generateRealtimeRecommendations(metrics)
  }
}

function generateRealtimeRecommendations(metrics: RealtimeMetrics): string[] {
  const recommendations: string[] = []

  if (metrics.errorRate > 0.05) {
    recommendations.push(`错误率过高 (${(metrics.errorRate * 100).toFixed(2)}%)，建议检查网络连接和服务器状态`)
  }

  if (metrics.reconnectRate > 0.1) {
    recommendations.push(`重连率过高 (${(metrics.reconnectRate * 100).toFixed(2)}%)，建议优化连接稳定性`)
  }

  if (metrics.averageLatency > 100) {
    recommendations.push(`平均延迟过高 (${metrics.averageLatency.toFixed(2)}ms)，建议优化消息处理和批处理策略`)
  }

  if (metrics.activeConnections > 50) {
    recommendations.push(`活跃连接数过多 (${metrics.activeConnections})，建议实现连接池和负载均衡`)
  }

  return recommendations
}
