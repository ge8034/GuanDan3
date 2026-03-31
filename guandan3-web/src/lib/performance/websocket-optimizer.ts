import { logger } from '@/lib/utils/logger'

interface MessageBatch {
  messages: any[]
  timestamp: number
  size: number
}

interface CompressionStats {
  originalSize: number
  compressedSize: number
  compressionRatio: number
  compressionTime: number
}

class WebSocketOptimizer {
  private messageQueues: Map<string, MessageBatch> = new Map()
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private compressionStats: CompressionStats[] = []
  private readonly BATCH_DELAY = 50
  private readonly MAX_BATCH_SIZE = 20
  private readonly MAX_BATCH_BYTES = 10240 // 10KB
  private readonly MAX_STATS_HISTORY = 100

  batchMessage(channel: string, message: any): Promise<void> {
    return new Promise((resolve) => {
      const queue = this.messageQueues.get(channel)
      
      if (!queue) {
        const newBatch: MessageBatch = {
          messages: [message],
          timestamp: Date.now(),
          size: this.estimateSize(message)
        }
        this.messageQueues.set(channel, newBatch)
      } else {
        queue.messages.push(message)
        queue.size += this.estimateSize(message)
      }

      const currentBatch = this.messageQueues.get(channel)!
      
      if (currentBatch.messages.length >= this.MAX_BATCH_SIZE || 
          currentBatch.size >= this.MAX_BATCH_BYTES) {
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
    const batch = this.messageQueues.get(channel)
    if (!batch || batch.messages.length === 0) return

    const timer = this.batchTimers.get(channel)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(channel)
    }

    const messages = [...batch.messages]
    this.messageQueues.delete(channel)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 0)
    })
  }

  async compressMessage(message: any): Promise<{ compressed: string; stats: CompressionStats }> {
    const startTime = performance.now()
    const original = JSON.stringify(message)
    const originalSize = new Blob([original]).size

    let compressed = original
    let compressedSize = originalSize

    try {
      if (typeof CompressionStream !== 'undefined') {
        const stream = new CompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        const encoder = new TextEncoder()
        const encoded = encoder.encode(original)
        
        writer.write(encoded)
        writer.close()
        
        const chunks: Uint8Array[] = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const compressedBytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          compressedBytes.set(chunk, offset)
          offset += chunk.length
        }
        
        let binaryString = ''
        for (let i = 0; i < compressedBytes.length; i++) {
          binaryString += String.fromCharCode(compressedBytes[i])
        }
        compressed = btoa(binaryString)
        compressedSize = compressedBytes.length
      }
    } catch (error) {
      logger.warn('[WebSocketOptimizer] Compression failed, using original:', error)
    }

    const compressionTime = performance.now() - startTime
    const stats: CompressionStats = {
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize :1,
      compressionTime
    }

    this.recordCompressionStats(stats)

    return { compressed, stats }
  }

  async decompressMessage(compressed: string): Promise<any> {
    try {
      const compressedBytes = Uint8Array.from(atob(compressed), c => c.charCodeAt(0))
      
      if (typeof DecompressionStream !== 'undefined') {
        const stream = new DecompressionStream('gzip')
        const writer = stream.writable.getWriter()
        const reader = stream.readable.getReader()
        
        writer.write(compressedBytes)
        writer.close()
        
        const chunks: Uint8Array[] = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) chunks.push(value)
        }
        
        const decompressedBytes = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          decompressedBytes.set(chunk, offset)
          offset += chunk.length
        }
        
        const decoder = new TextDecoder()
        const decompressed = decoder.decode(decompressedBytes)
        return JSON.parse(decompressed)
      }
    } catch (error) {
      logger.warn('[WebSocketOptimizer] Decompression failed:', error)
    }

    return JSON.parse(compressed)
  }

  private estimateSize(message: any): number {
    try {
      return new Blob([JSON.stringify(message)]).size
    } catch {
      return 100
    }
  }

  private recordCompressionStats(stats: CompressionStats): void {
    this.compressionStats.push(stats)
    if (this.compressionStats.length > this.MAX_STATS_HISTORY) {
      this.compressionStats.shift()
    }
  }

  getCompressionStats(): {
    averageRatio: number
    averageTime: number
    totalSavings: number
    messageCount: number
  } {
    if (this.compressionStats.length === 0) {
      return {
        averageRatio: 1,
        averageTime: 0,
        totalSavings: 0,
        messageCount: 0
      }
    }

    const totalRatio = this.compressionStats.reduce((sum, s) => sum + s.compressionRatio, 0)
    const totalTime = this.compressionStats.reduce((sum, s) => sum + s.compressionTime, 0)
    const totalOriginal = this.compressionStats.reduce((sum, s) => sum + s.originalSize, 0)
    const totalCompressed = this.compressionStats.reduce((sum, s) => sum + s.compressedSize, 0)

    return {
      averageRatio: totalRatio / this.compressionStats.length,
      averageTime: totalTime / this.compressionStats.length,
      totalSavings: totalOriginal - totalCompressed,
      messageCount: this.compressionStats.length
    }
  }

  optimizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload

    const optimized: any = {}
    
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        continue
      }
      
      if (typeof value === 'string' && value.length === 0) {
        continue
      }
      
      if (Array.isArray(value) && value.length === 0) {
        continue
      }
      
      optimized[key] = value
    }

    return optimized
  }

  clearQueue(channel?: string): void {
    if (channel) {
      const timer = this.batchTimers.get(channel)
      if (timer) {
        clearTimeout(timer)
        this.batchTimers.delete(channel)
      }
      this.messageQueues.delete(channel)
    } else {
      this.batchTimers.forEach(timer => clearTimeout(timer))
      this.batchTimers.clear()
      this.messageQueues.clear()
    }
  }

  getQueueStats(): Array<{ channel: string; messageCount: number; size: number; age: number }> {
    return Array.from(this.messageQueues.entries()).map(([channel, batch]) => ({
      channel,
      messageCount: batch.messages.length,
      size: batch.size,
      age: Date.now() - batch.timestamp
    }))
  }

  reset(): void {
    this.clearQueue()
    this.compressionStats = []
  }
}

export const webSocketOptimizer = new WebSocketOptimizer()
