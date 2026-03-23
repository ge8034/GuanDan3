import { supabase } from '@/lib/supabase/client'
import { cache, createCacheKey } from '@/lib/utils/cache'

interface QueryOptions {
  cacheKey?: string
  cacheTTL?: number
  enabled?: boolean
}

interface BatchQueryOptions<T> {
  queries: Array<{
    key: string
    query: () => Promise<T>
  }>
  cacheTTL?: number
}

export class ApiOptimizer {
  private static instance: ApiOptimizer

  private constructor() {}

  static getInstance(): ApiOptimizer {
    if (!ApiOptimizer.instance) {
      ApiOptimizer.instance = new ApiOptimizer()
    }
    return ApiOptimizer.instance
  }

  async query<T>(
    queryFn: () => Promise<T>,
    options: QueryOptions = {}
  ): Promise<T | null> {
    const { cacheKey, cacheTTL = 60000, enabled = true } = options

    if (!enabled) {
      return queryFn()
    }

    if (cacheKey) {
      const cached = cache.get<T>(cacheKey)
      if (cached !== null) {
        return cached
      }
    }

    try {
      const result = await queryFn()
      
      if (cacheKey && result !== null) {
        cache.set(cacheKey, result, cacheTTL)
      }

      return result
    } catch (error) {
      console.error('API query error:', error)
      return null
    }
  }

  async batchQuery<T>(options: BatchQueryOptions<T>): Promise<Map<string, T>> {
    const { queries, cacheTTL = 60000 } = options
    const results = new Map<string, T>()
    const uncachedQueries: Array<{ key: string; query: () => Promise<T> }> = []

    for (const { key, query } of queries) {
      const cached = cache.get<T>(key)
      if (cached !== null) {
        results.set(key, cached)
      } else {
        uncachedQueries.push({ key, query })
      }
    }

    if (uncachedQueries.length > 0) {
      const promises = uncachedQueries.map(async ({ key, query }) => {
        try {
          const result = await query()
          results.set(key, result)
          cache.set(key, result, cacheTTL)
        } catch (error) {
          console.error(`Batch query error for ${key}:`, error)
        }
      })

      await Promise.all(promises)
    }

    return results
  }

  async parallelQuery<T>(
    queries: Array<() => Promise<T>>,
    options: { maxConcurrency?: number } = {}
  ): Promise<T[]> {
    const { maxConcurrency = 5 } = options
    const results: T[] = []
    const executing: Promise<void>[] = []

    for (const query of queries) {
      const promise = query().then(result => {
        results.push(result)
      })

      executing.push(promise)

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
        executing.splice(
          executing.findIndex(p => p === promise),
          1
        )
      }
    }

    await Promise.all(executing)
    return results
  }

  invalidateCache(pattern?: string): void {
    if (pattern) {
      const keys = Array.from((cache as any).cache.keys())
      keys.forEach(key => {
        if (typeof key === 'string' && key.includes(pattern)) {
          cache.delete(key)
        }
      })
    } else {
      cache.clear()
    }
  }

  prefetch<T>(queryFn: () => Promise<T>, cacheKey: string, cacheTTL?: number): void {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(async () => {
        try {
          const result = await queryFn()
          cache.set(cacheKey, result, cacheTTL || 60000)
        } catch (error) {
          console.error('Prefetch error:', error)
        }
      })
    } else {
      setTimeout(async () => {
        try {
          const result = await queryFn()
          cache.set(cacheKey, result, cacheTTL || 60000)
        } catch (error) {
          console.error('Prefetch error:', error)
        }
      }, 0)
    }
  }
}

export const apiOptimizer = ApiOptimizer.getInstance()

export const optimizedQueries = {
  async getRoom(roomId: string): Promise<any | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.from('rooms').select('*').eq('id', roomId).single()
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('room', roomId),
        cacheTTL: 30000
      }
    )
  },

  async getRoomMembers(roomId: string): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.from('room_members')
          .select('id,room_id,uid,seat_no,ready,online,member_type,ai_key,difficulty')
          .eq('room_id', roomId)
          .order('seat_no')
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('room_members', roomId),
        cacheTTL: 10000
      }
    )
  },

  async getActiveRooms(limit: number = 50): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.rpc('get_active_rooms', { limit_count: limit })
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('active_rooms', limit),
        cacheTTL: 15000
      }
    )
  },

  async getUserStats(userId: string): Promise<any | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.rpc('get_user_game_stats', { p_user_id: userId })
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('user_stats', userId),
        cacheTTL: 60000
      }
    )
  },

  async getLeaderboard(
    leaderboardType: string,
    gameType: string = 'standard',
    limit: number = 50
  ): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.rpc('get_leaderboard_data', {
          p_leaderboard_type: leaderboardType,
          p_game_type: gameType,
          p_limit: limit
        })
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('leaderboard', leaderboardType, gameType, limit),
        cacheTTL: 30000
      }
    )
  },

  async getUserRecentGames(userId: string, limit: number = 20): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.rpc('get_user_recent_games', { p_user_id: userId, p_limit: limit })
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('user_recent_games', userId, limit),
        cacheTTL: 45000
      }
    )
  },

  async getFriends(userId: string): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase
          .from('friendships')
          .select('*, friend:friend_id(*)')
          .eq('user_id', userId)
          .eq('status', 'accepted')
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('friends', userId),
        cacheTTL: 30000
      }
    )
  },

  async getChatMessages(roomId: string, limit: number = 50): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id,room_id,user_id,message,message_type,created_at')
          .eq('room_id', roomId)
          .order('created_at', { ascending: false })
          .limit(limit)
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('chat_messages', roomId, limit),
        cacheTTL: 5000
      }
    )
  },

  async getGameRecord(gameId: string): Promise<any | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase.from('game_records').select('*').eq('id', gameId).single()
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('game_record', gameId),
        cacheTTL: 120000
      }
    )
  },

  async getGameParticipants(gameId: string): Promise<any[] | null> {
    return apiOptimizer.query(
      async () => {
        const { data, error } = await supabase
          .from('game_participants')
          .select('*, user:user_id(*)')
          .eq('game_record_id', gameId)
        if (error) throw error
        return data
      },
      {
        cacheKey: createCacheKey('game_participants', gameId),
        cacheTTL: 120000
      }
    )
  }
}

export const prefetchData = {
  prefetchActiveRooms: () => {
    apiOptimizer.prefetch(
      () => optimizedQueries.getActiveRooms(50),
      createCacheKey('active_rooms', 50),
      15000
    )
  },

  prefetchUserStats: (userId: string) => {
    apiOptimizer.prefetch(
      () => optimizedQueries.getUserStats(userId),
      createCacheKey('user_stats', userId),
      60000
    )
  },

  prefetchLeaderboard: (leaderboardType: string = 'overall') => {
    apiOptimizer.prefetch(
      () => optimizedQueries.getLeaderboard(leaderboardType),
      createCacheKey('leaderboard', leaderboardType, 'standard', 50),
      30000
    )
  },

  prefetchFriends: (userId: string) => {
    apiOptimizer.prefetch(
      () => optimizedQueries.getFriends(userId),
      createCacheKey('friends', userId),
      30000
    )
  }
}

export const invalidateCache = {
  invalidateRoom: (roomId: string) => {
    apiOptimizer.invalidateCache(`room:${roomId}`)
    apiOptimizer.invalidateCache(`room_members:${roomId}`)
  },

  invalidateUserStats: (userId: string) => {
    apiOptimizer.invalidateCache(`user_stats:${userId}`)
  },

  invalidateLeaderboard: (leaderboardType: string) => {
    apiOptimizer.invalidateCache(`leaderboard:${leaderboardType}`)
  },

  invalidateFriends: (userId: string) => {
    apiOptimizer.invalidateCache(`friends:${userId}`)
  },

  invalidateChatMessages: (roomId: string) => {
    apiOptimizer.invalidateCache(`chat_messages:${roomId}`)
  },

  invalidateAll: () => {
    apiOptimizer.invalidateCache()
  }
}
