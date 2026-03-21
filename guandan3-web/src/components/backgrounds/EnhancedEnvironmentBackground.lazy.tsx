'use client'

import dynamic from 'next/dynamic'

export default dynamic(() => import('./EnhancedEnvironmentBackground'), {
  loading: () => (
    <div className="min-h-screen bg-background-primary animate-pulse" />
  ),
  ssr: false
})
