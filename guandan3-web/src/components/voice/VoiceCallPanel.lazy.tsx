'use client'

import dynamic from 'next/dynamic'

export const VoiceCallPanel = dynamic(() => import('./VoiceCallPanel'), {
  ssr: false,
  loading: () => (
    <div className="fixed top-20 right-4 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
      <div className="animate-pulse flex items-center space-x-2">
        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
        <div className="h-4 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  )
})
