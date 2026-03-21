'use client'

import dynamic from 'next/dynamic'

export const RoomInvitationPanel = dynamic(() => import('./RoomInvitationPanel').then(mod => ({ default: mod.RoomInvitationPanel })), {
  loading: () => <div className="animate-pulse bg-white/5 rounded-lg h-64" />,
  ssr: false
})
