'use client'

import dynamic from 'next/dynamic'

export const ComboEffect = dynamic(
  () => import('./ComboEffect'),
  {
    ssr: false
  }
)
