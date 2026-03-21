'use client'

import dynamic from 'next/dynamic'

export const CloudMountainBackground = dynamic(
  () => import('./CloudMountainBackground'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
    )
  }
)
