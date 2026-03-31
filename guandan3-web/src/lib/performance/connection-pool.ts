import { supabase } from '@/lib/supabase/client'
import { realtimeOptimizer } from './realtime-optimizer'

import { logger } from '@/lib/utils/logger'
interface PooledConnection {
  id: string
  channel: string
  channelInstance: any
  lastUsed: number
  refCount: number
}

class ConnectionPool {
  private pool: Map<string, PooledConnection> = new Map()
  private readonly MAX_POOL_SIZE = 10
  private readonly MAX_IDLE_TIME = 300000 // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.startCleanup()
  }

  acquire(channelName: string): PooledConnection {
    const existing = this.pool.get(channelName)
    
    if (existing && this.isValid(existing)) {
      existing.refCount++
      existing.lastUsed = Date.now()
      return existing
    }

    if (this.pool.size >= this.MAX_POOL_SIZE) {
      this.evictOldest()
    }

    const connection: PooledConnection = {
      id: `pool-${channelName}-${Date.now()}`,
      channel: channelName,
      channelInstance: supabase.channel(channelName),
      lastUsed: Date.now(),
      refCount: 1
    }

    this.pool.set(channelName, connection)
    return connection
  }

  release(channelName: string): void {
    const connection = this.pool.get(channelName)
    if (!connection) return

    connection.refCount--
    connection.lastUsed = Date.now()

    if (connection.refCount <= 0) {
      this.scheduleRemoval(channelName)
    }
  }

  private isValid(connection: PooledConnection): boolean {
    const age = Date.now() - connection.lastUsed
    return age < this.MAX_IDLE_TIME && connection.refCount > 0
  }

  private evictOldest(): void {
    let oldest: string | null = null
    let oldestTime = Infinity

    Array.from(this.pool.entries()).forEach(([name, conn]) => {
      if (conn.refCount === 0 && conn.lastUsed < oldestTime) {
        oldest = name
        oldestTime = conn.lastUsed
      }
    })

    if (oldest) {
      this.remove(oldest)
    }
  }

  private scheduleRemoval(channelName: string): void {
    setTimeout(() => {
      const connection = this.pool.get(channelName)
      if (connection && connection.refCount <= 0) {
        this.remove(channelName)
      }
    }, this.MAX_IDLE_TIME)
  }

  private remove(channelName: string): void {
    const connection = this.pool.get(channelName)
    if (!connection) return

    try {
      supabase.removeChannel(connection.channelInstance)
    } catch (error) {
      logger.error(`[ConnectionPool] Error removing channel ${channelName}:`, error)
    }

    this.pool.delete(channelName)
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      const toRemove: string[] = []

      Array.from(this.pool.entries()).forEach(([name, conn]) => {
        if (conn.refCount === 0 && (now - conn.lastUsed) > this.MAX_IDLE_TIME) {
          toRemove.push(name)
        }
      })

      toRemove.forEach(name => this.remove(name))

      if (toRemove.length > 0) {
        logger.debug(`[ConnectionPool] Cleaned up ${toRemove.length} idle connections`)
      }
    }, 60000) // Check every minute
  }

  getStats() {
    return {
      poolSize: this.pool.size,
      connections: Array.from(this.pool.values()).map(conn => ({
        id: conn.id,
        channel: conn.channel,
        refCount: conn.refCount,
        lastUsed: conn.lastUsed,
        age: Date.now() - conn.lastUsed
      }))
    }
  }

  clear(): void {
    Array.from(this.pool.entries()).forEach(([name, conn]) => {
      try {
        supabase.removeChannel(conn.channelInstance)
      } catch (error) {
        logger.error(`[ConnectionPool] Error clearing channel ${name}:`, error)
      }
    })
    this.pool.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.clear()
  }
}

export const connectionPool = new ConnectionPool()
