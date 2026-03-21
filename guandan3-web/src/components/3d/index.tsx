import dynamic from 'next/dynamic'

export const Card3D = dynamic(() => import('./Card3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
})

export const GameTable3D = dynamic(() => import('./GameTable3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
})

export const CardTable3D = dynamic(() => import('./CardTable3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
})

export const ParticleEffect = dynamic(() => import('./ParticleEffect'), {
  ssr: false,
  loading: () => null
})

export const ParticleEffects = dynamic(() => import('./ParticleEffects').then(mod => ({ default: mod.ParticleEffects })), {
  ssr: false,
  loading: () => null
})

export const PerformanceMonitor = dynamic(() => import('./PerformanceMonitor'), {
  ssr: false,
  loading: () => null
})
