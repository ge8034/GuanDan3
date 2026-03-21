'use client'

import dynamic from 'next/dynamic'

export const StaggerContainer = dynamic(() => import('./StaggerContainer'), {
  loading: () => <div className="animate-pulse bg-white/5 rounded-lg h-32" />,
  ssr: false
})
