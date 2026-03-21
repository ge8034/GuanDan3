import { useState, useEffect, useCallback } from 'react'
import { optimizedQueries, prefetchData, invalidateCache } from '@/lib/utils/api-optimization'

interface UseOptimizedQueryOptions {
  enabled?: boolean
  refetchInterval?: number
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

export function useOptimizedQuery<T>(
  queryFn: () => Promise<T | null>,
  options: UseOptimizedQueryOptions = {}
) {
  const { enabled = true, refetchInterval, onSuccess, onError } = options
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [queryFn, enabled, onSuccess, onError])

  useEffect(() => {
    fetchData()

    if (refetchInterval) {
      const interval = setInterval(fetchData, refetchInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refetchInterval])

  return { data, isLoading, error, refetch: fetchData }
}

export function useRoom(roomId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getRoom(roomId),
    options
  )
}

export function useRoomMembers(roomId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getRoomMembers(roomId),
    options
  )
}

export function useActiveRooms(limit: number = 50, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getActiveRooms(limit),
    options
  )
}

export function useUserStats(userId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getUserStats(userId),
    options
  )
}

export function useLeaderboard(
  leaderboardType: string,
  gameType: string = 'standard',
  limit: number = 50,
  options: UseOptimizedQueryOptions = {}
) {
  return useOptimizedQuery(
    () => optimizedQueries.getLeaderboard(leaderboardType, gameType, limit),
    options
  )
}

export function useUserRecentGames(userId: string, limit: number = 20, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getUserRecentGames(userId, limit),
    options
  )
}

export function useFriends(userId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getFriends(userId),
    options
  )
}

export function useChatMessages(roomId: string, limit: number = 50, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getChatMessages(roomId, limit),
    options
  )
}

export function useGameRecord(gameId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getGameRecord(gameId),
    options
  )
}

export function useGameParticipants(gameId: string, options: UseOptimizedQueryOptions = {}) {
  return useOptimizedQuery(
    () => optimizedQueries.getGameParticipants(gameId),
    options
  )
}

export function usePrefetch() {
  return {
    prefetchActiveRooms: prefetchData.prefetchActiveRooms,
    prefetchUserStats: prefetchData.prefetchUserStats,
    prefetchLeaderboard: prefetchData.prefetchLeaderboard,
    prefetchFriends: prefetchData.prefetchFriends
  }
}

export function useInvalidateCache() {
  return {
    invalidateRoom: invalidateCache.invalidateRoom,
    invalidateUserStats: invalidateCache.invalidateUserStats,
    invalidateLeaderboard: invalidateCache.invalidateLeaderboard,
    invalidateFriends: invalidateCache.invalidateFriends,
    invalidateChatMessages: invalidateCache.invalidateChatMessages,
    invalidateAll: invalidateCache.invalidateAll
  }
}
