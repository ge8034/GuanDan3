'use client'

import dynamic from 'next/dynamic'

export const GameDealAnimation = dynamic(
  () => import('./GameDealAnimation'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-8 py-4 shadow-2xl">
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            加载中...
          </div>
        </div>
      </div>
    )
  }
)
