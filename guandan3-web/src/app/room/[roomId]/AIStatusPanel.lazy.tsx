'use client'

import dynamic from 'next/dynamic'

export const AIStatusPanel = dynamic(() => import('./AIStatusPanel').then(mod => ({ default: mod.AIStatusPanel })), {
  loading: () => <div className="animate-pulse bg-white/5 rounded-lg h-32" />,
  ssr: false
})
