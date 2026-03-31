/**
 * PWA 组件模块
 *
 * 提供完整的 PWA（渐进式 Web 应用）功能支持，包括：
 * - 离线检测和提示
 * - PWA 安装提示
 * - Service Worker 状态监控
 * - 网络状态横幅
 *
 * @example
 * ```tsx
 * import { PWAProvider, OfflineIndicator, PWAInstallPrompt } from '@/components/pwa'
 *
 * function App() {
 *   return (
 *     <PWAProvider>
 *       <OfflineIndicator />
 *       <PWAInstallPrompt />
 *       <Layout />
 *     </PWAProvider>
 *   )
 * }
 * ```
 */

export { PWAProvider, PWAContext } from './PWAProvider'

export { OfflineIndicator, NetworkBanner } from './OfflineIndicator'

export { PWAInstallPrompt, PWAInstallButton } from './PWAInstallPrompt'

export { ServiceWorkerStatus, UpdateBanner } from './ServiceWorkerStatus'

export { useOnlineStatus } from './useOnlineStatus'
export type { OnlineStatus } from './useOnlineStatus'

export { usePWAInstall } from './usePWAInstall'
export type { PWAInstallState } from './usePWAInstall'
