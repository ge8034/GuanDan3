'use client'

import dynamic from 'next/dynamic'

export const RippleEffect = dynamic(() => import('./RippleEffect'), {
  loading: () => null,
  ssr: false
})
