interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class Cache {
  private cache: Map<string, CacheEntry<any>>
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  set<T>(key: string, data: T, ttl: number = 60000): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    const now = Date.now()
    const age = now - entry.timestamp

    if (age > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  cleanup(): number {
    const now = Date.now()
    let removed = 0

    const entries = Array.from(this.cache.entries())
    for (const [key, entry] of entries) {
      const age = now - entry.timestamp
      if (age > entry.ttl) {
        this.cache.delete(key)
        removed++
      }
    }

    return removed
  }
}

export const cache = new Cache(100)

export const withCache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string
    ttl?: number
  } = {}
): T => {
  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}-${JSON.stringify(args)}`

    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result, options.ttl || 60000)

    return result
  }) as T
}

export const memoizeAsync = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string
    ttl?: number
  } = {}
): T => {
  const pendingPromises = new Map<string, Promise<any>>()

  return (async (...args: Parameters<T>) => {
    const key = options.keyGenerator
      ? options.keyGenerator(...args)
      : `${fn.name}-${JSON.stringify(args)}`

    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    if (pendingPromises.has(key)) {
      return pendingPromises.get(key)!
    }

    const promise = fn(...args)
    pendingPromises.set(key, promise)

    try {
      const result = await promise
      cache.set(key, result, options.ttl || 60000)
      return result
    } finally {
      pendingPromises.delete(key)
    }
  }) as T
}

export const createCacheKey = (...parts: (string | number | boolean | null | undefined)[]): string => {
  return parts.filter(Boolean).join(':')
}

setInterval(() => {
  cache.cleanup()
}, 60000)
