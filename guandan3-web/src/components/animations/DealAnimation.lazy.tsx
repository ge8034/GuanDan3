'use client'

import dynamic from 'next/dynamic'

export const DealAnimation = dynamic(
  () => import('./DealAnimation'),
  {
    ssr: false
  }
)
