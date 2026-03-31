'use client'

import { useEffect, useState } from 'react'

/**
 * 在线状态
 */
export interface OnlineStatus {
  /** 是否在线 */
  isOnline: boolean
  /** 状态变更时间 */
  since: Date
}

/**
 * 使用在线状态 Hook
 *
 * 监听浏览器在线/离线状态变化。
 *
 * @returns 在线状态对象
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOnline, since } = useOnlineStatus()
 *
 *   return (
 *     <div>
 *       {isOnline ? '在线' : '离线'}
 *       <small>自 {since.toLocaleString()}</small>
 *     </div>
 *   )
 * }
 * ```
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => ({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    since: new Date(),
  }))

  useEffect(() => {
    const handleOnline = () => {
      setStatus({
        isOnline: true,
        since: new Date(),
      })
    }

    const handleOffline = () => {
      setStatus({
        isOnline: false,
        since: new Date(),
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return status
}
