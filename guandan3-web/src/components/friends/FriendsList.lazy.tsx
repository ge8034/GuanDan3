'use client'

import dynamic from 'next/dynamic'

export const FriendsList = dynamic(() => import('./FriendsList'), {
  loading: () => <div className="animate-pulse bg-white/5 rounded-lg h-64" />,
  ssr: false
})
