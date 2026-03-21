'use client'

import dynamic from 'next/dynamic'

export const EnhancedChatBox = dynamic(() => import('./EnhancedChatBox').then(mod => ({ default: mod.EnhancedChatBox })), {
  loading: () => <div className="animate-pulse bg-white/5 rounded-lg h-64" />,
  ssr: false
})
