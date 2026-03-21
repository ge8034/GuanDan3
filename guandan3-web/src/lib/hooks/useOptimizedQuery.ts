import { useState, useEffect, useRef, useCallback } from 'react'
import { cache, createCacheKey } from '@/lib/utils/cache'

interface UseOptimizedQueryOptions<T> {
  cacheKey?: string
  cacheTTL?: number
  staleTime?: number
  refetchInterval?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  retry?: number
  retryDelay?: number
}

interface UseOptimizedQueryResult<T> {
  data: T | null
  isLoading: boolean
  isError: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
}

export function useOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  options: UseOptimizedQueryOptions<T> = {}
): UseOptimizedQueryResult<T> {
  const {
    cacheKey,
    cacheTTL = 60000,
    staleTime = 0,
    refetchInterval,
    enabled = true,
    onSuccess,
    onError,
    retry = 0,
    retryDelay = 1000
  } = options

  const [data, setData] = useState<T | null>(() => {
    if (cacheKey) {
      return cache.get<T>(cacheKey)
    }
    return null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(() => {
    if (cacheKey && cache.has(cacheKey)) {
      return Date.now()
    }
    return 0
  })

  const retryCountRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const fetchDataRef = useRef<((isRefetch?: boolean) => Promise<void>) | null>(null)

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled || !isMountedRef.current) {
      return
    }

    if (!isRefetch && cacheKey && cache.has(cacheKey)) {
      const now = Date.now()
      const age = now - lastFetchTime
      
      if (age < staleTime) {
        return
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      const result = await queryFn()
      
      if (!isMountedRef.current) {
        return
      }

      setData(result)
      setIsLoading(false)
      setLastFetchTime(Date.now())
      retryCountRef.current = 0

      if (cacheKey) {
        cache.set(cacheKey, result, cacheTTL)
      }

      onSuccess?.(result)
    } catch (err) {
      if (!isMountedRef.current) {
        return
      }

      const errorObj = err instanceof Error ? err : new Error(String(err))
      
      if (retryCountRef.current < retry) {
        retryCountRef.current++
        setTimeout(() => {
          fetchDataRef.current?.(isRefetch)
        }, retryDelay * retryCountRef.current)
        return
      }

      setIsError(true)
      setError(errorObj)
      setIsLoading(false)
      onError?.(errorObj)
    }
  }, [queryFn, enabled, cacheKey, cacheTTL, staleTime, lastFetchTime, onSuccess, onError, retry, retryDelay])

  useEffect(() => {
    fetchDataRef.current = fetchData
  }, [fetchData])

  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  const invalidate = useCallback(() => {
    if (cacheKey) {
      cache.delete(cacheKey)
    }
    setData(null)
    setLastFetchTime(0)
  }, [cacheKey])

  useEffect(() => {
    isMountedRef.current = true
    fetchDataRef.current?.()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(() => {
        refetch()
      }, refetchInterval)

      return () => clearInterval(interval)
    }
  }, [refetchInterval, enabled, refetch])

  return {
    data,
    isLoading,
    isError,
    error,
    refetch,
    invalidate
  }
}

interface UseOptimizedMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
  onSettled?: () => void
  invalidateQueries?: string[]
}

interface UseOptimizedMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>
  mutateAsync: (variables: TVariables) => Promise<TData>
  isLoading: boolean
  isError: boolean
  error: Error | null
  reset: () => void
}

export function useOptimizedMutation<TData = any, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseOptimizedMutationOptions<TData, TVariables> = {}
): UseOptimizedMutationResult<TData, TVariables> {
  const {
    onSuccess,
    onError,
    onSettled,
    invalidateQueries = []
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    setIsLoading(true)
    setIsError(false)
    setError(null)

    try {
      const result = await mutationFn(variables)
      
      invalidateQueries.forEach(key => {
        cache.delete(key)
      })

      onSuccess?.(result)
      return result
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err))
      setIsError(true)
      setError(errorObj)
      onError?.(errorObj)
      return null
    } finally {
      setIsLoading(false)
      onSettled?.()
    }
  }, [mutationFn, onSuccess, onError, onSettled, invalidateQueries])

  const mutateAsync = useCallback(async (variables: TVariables) => {
    const result = await mutate(variables)
    if (result === null) {
      throw error || new Error('Mutation failed')
    }
    return result
  }, [mutate, error])

  const reset = useCallback(() => {
    setIsLoading(false)
    setIsError(false)
    setError(null)
  }, [])

  return {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    error,
    reset
  }
}
