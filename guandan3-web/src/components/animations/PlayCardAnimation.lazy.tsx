'use client'

import dynamic from 'next/dynamic'

export const PlayCardAnimation = dynamic(
  () => import('./PlayCardAnimation'),
  {
    ssr: false
  }
)
