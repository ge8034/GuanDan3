'use client'

import dynamic from 'next/dynamic'

const DatabasePerformanceMonitor = dynamic(() => import('./DatabasePerformanceMonitor'), {
  ssr: false,
  loading: () => null
})

const NetworkPerformanceMonitor = dynamic(() => import('./NetworkPerformanceMonitor'), {
  ssr: false,
  loading: () => null
})

const WebSocketPerformanceMonitor = dynamic(() => import('./WebSocketPerformanceMonitor'), {
  ssr: false,
  loading: () => null
})

export default function MonitoringComponents() {
  return (
    <>
      <DatabasePerformanceMonitor />
      <NetworkPerformanceMonitor />
      <WebSocketPerformanceMonitor />
    </>
  )
}
