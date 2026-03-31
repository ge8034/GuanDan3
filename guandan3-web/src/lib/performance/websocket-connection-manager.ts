import { webSocketHeartbeat, HeartbeatStats } from './websocket-heartbeat'
import { webSocketReconnectManager, ReconnectStats } from './websocket-reconnect'

import { logger } from '@/lib/utils/logger'
export interface ConnectionManagerConfig {
  enableHeartbeat: boolean
  enableAutoReconnect: boolean
  heartbeatInterval?: number
  reconnectMaxRetries?: number
}

export interface ConnectionHealth {
  heartbeat: HeartbeatStats
  reconnect: ReconnectStats
  overall: 'healthy' | 'degraded' | 'unhealthy'
  message: string
}

export class WebSocketConnectionManager {
  private static instance: WebSocketConnectionManager
  private config: ConnectionManagerConfig
  private connection: WebSocket | null = null
  private connectionUrl: string = ''
  private manualDisconnect = false

  private constructor(config: Partial<ConnectionManagerConfig> = {}) {
    this.config = {
      enableHeartbeat: config.enableHeartbeat !== false,
      enableAutoReconnect: config.enableAutoReconnect !== false,
      heartbeatInterval: config.heartbeatInterval,
      reconnectMaxRetries: config.reconnectMaxRetries
    }

    this.setupHeartbeatCallbacks()
    this.setupReconnectCallbacks()
  }

  static getInstance(config?: Partial<ConnectionManagerConfig>): WebSocketConnectionManager {
    if (!WebSocketConnectionManager.instance) {
      WebSocketConnectionManager.instance = new WebSocketConnectionManager(config)
    }
    return WebSocketConnectionManager.instance
  }

  connect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        logger.debug(`Connecting to WebSocket: ${url}`)
        this.connectionUrl = url
        this.manualDisconnect = false

        const ws = new WebSocket(url)
        this.connection = ws

        ws.onopen = () => {
          logger.debug('WebSocket connected successfully')
          this.onConnectionOpen()
          resolve(ws)
        }

        ws.onerror = (error) => {
          logger.error('WebSocket error:', error)
          this.onConnectionError(error)
          reject(error)
        }

        ws.onclose = (event) => {
          logger.debug('WebSocket closed:', event)
          this.onConnectionClose(event)
        }

        ws.onmessage = (event) => {
          this.handleMessage(event)
        }
      } catch (error) {
        logger.error('Failed to create WebSocket connection:', error)
        reject(error)
      }
    })
  }

  disconnect(): void {
    logger.debug('Manual disconnect requested')
    this.manualDisconnect = true

    if (this.connection) {
      this.connection.close(1000, 'Manual disconnect')
    }

    this.stopHeartbeat()
    this.stopReconnect()
  }

  send(data: string | ArrayBuffer): boolean {
    if (!this.connection || this.connection.readyState !== WebSocket.OPEN) {
      logger.warn('Cannot send message: connection not ready')
      return false
    }

    try {
      this.connection.send(data)
      return true
    } catch (error) {
      logger.error('Failed to send message:', error)
      return false
    }
  }

  getConnectionState(): {
    connected: boolean
    connecting: boolean
    reconnecting: boolean
    readyState: number
  } {
    if (!this.connection) {
      return {
        connected: false,
        connecting: false,
        reconnecting: false,
        readyState: WebSocket.CLOSED
      }
    }

    const reconnectState = webSocketReconnectManager.getState()
    return {
      connected: this.connection.readyState === WebSocket.OPEN,
      connecting: this.connection.readyState === WebSocket.CONNECTING,
      reconnecting: reconnectState.isReconnecting,
      readyState: this.connection.readyState
    }
  }

  getConnectionHealth(): ConnectionHealth {
    const heartbeatStats = webSocketHeartbeat.getStats()
    const reconnectStats = webSocketReconnectManager.getStats()
    const heartbeatHealth = webSocketHeartbeat.getHealthStatus()
    const reconnectHealth = webSocketReconnectManager.getHealthStatus()

    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    let message = '连接正常'

    if (!heartbeatHealth.healthy) {
      overall = 'unhealthy'
      message = heartbeatHealth.message
    } else if (!reconnectHealth.healthy) {
      overall = reconnectHealth.status === 'reconnecting' ? 'degraded' : 'unhealthy'
      message = reconnectHealth.message
    } else if (heartbeatStats.averageLatency > 500) {
      overall = 'degraded'
      message = '连接延迟较高'
    }

    return {
      heartbeat: heartbeatStats,
      reconnect: reconnectStats,
      overall,
      message
    }
  }

  onMessage(callback: (event: MessageEvent) => void): void {
    this.messageCallback = callback
  }

  onOpen(callback: () => void): void {
    this.openCallback = callback
  }

  onError(callback: (error: Event) => void): void {
    this.errorCallback = callback
  }

  onClose(callback: (event: CloseEvent) => void): void {
    this.closeCallback = callback
  }

  updateConfig(config: Partial<ConnectionManagerConfig>): void {
    this.config = { ...this.config, ...config }

    if (config.heartbeatInterval !== undefined) {
      webSocketHeartbeat.updateConfig({ interval: config.heartbeatInterval })
    }

    if (config.reconnectMaxRetries !== undefined) {
      webSocketReconnectManager.updateConfig({ maxRetries: config.reconnectMaxRetries })
    }

    logger.debug('Connection manager config updated:', this.config)
  }

  reset(): void {
    this.stopHeartbeat()
    this.stopReconnect()
    webSocketHeartbeat.reset()
    webSocketReconnectManager.reset()
    this.manualDisconnect = false
    logger.debug('Connection manager reset')
  }

  private messageCallback?: (event: MessageEvent) => void
  private openCallback?: () => void
  private errorCallback?: (error: Event) => void
  private closeCallback?: (event: CloseEvent) => void

  private onConnectionOpen(): void {
    if (this.config.enableHeartbeat) {
      this.startHeartbeat()
    }

    if (this.openCallback) {
      this.openCallback()
    }
  }

  private onConnectionError(error: Event): void {
    if (this.errorCallback) {
      this.errorCallback(error)
    }
  }

  private onConnectionClose(event: CloseEvent): void {
    if (this.closeCallback) {
      this.closeCallback(event)
    }

    if (!this.manualDisconnect && this.config.enableAutoReconnect) {
      const reason = event.reason || 'Connection closed'
      webSocketReconnectManager.startReconnect(reason)
    }

    this.stopHeartbeat()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)

      if (data.type === 'heartbeat') {
        webSocketHeartbeat.recordHeartbeatReceived()
        return
      }

      if (this.messageCallback) {
        this.messageCallback(event)
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error)
      if (this.messageCallback) {
        this.messageCallback(event)
      }
    }
  }

  private startHeartbeat(): void {
    webSocketHeartbeat.start()
  }

  private stopHeartbeat(): void {
    webSocketHeartbeat.stop()
  }

  private stopReconnect(): void {
    webSocketReconnectManager.stopReconnect()
  }

  private setupHeartbeatCallbacks(): void {
    webSocketHeartbeat.onSend(() => {
      if (this.connection && this.connection.readyState === WebSocket.OPEN) {
        this.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }))
      }
    })
  }

  private setupReconnectCallbacks(): void {
    webSocketReconnectManager.onAttempt((attempt) => {
      logger.debug(`Reconnection attempt ${attempt}`)
    })

    webSocketReconnectManager.onSuccess(() => {
      logger.debug('Reconnection successful')
      if (this.connectionUrl) {
        this.connect(this.connectionUrl).catch(error => {
          logger.error('Failed to reconnect after successful attempt:', error)
        })
      }
    })

    webSocketReconnectManager.onFailure((error) => {
      logger.error('Reconnection failed:', error)
    })
  }
}

export const webSocketConnectionManager = WebSocketConnectionManager.getInstance()
