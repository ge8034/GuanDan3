'use client'

import dynamic from 'next/dynamic'

export const VictoryEffect = dynamic(
  () => import('./VictoryEffect'),
  {
    ssr: false
  }
)
