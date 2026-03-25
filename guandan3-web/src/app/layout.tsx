import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/theme-context'
import NoiseOverlay from '@/components/effects/NoiseOverlay'
import Navigation from '@/components/Navigation'
import { setupResourcePreloading, setupPerformanceObserver } from '@/lib/performance/resource-optimizer'
import MonitoringComponents from '@/components/monitoring/MonitoringComponents'
import ContextStatusBarPro from '@/components/ContextStatusBarPro'
import { statusbarConfig } from '@/config/statusbar'

export const metadata: Metadata = {
  title: '掼蛋 3',
  description: '在线掼蛋对战',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '掼蛋 3',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#6BA539',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (typeof window !== 'undefined') {
    setupResourcePreloading()
    setupPerformanceObserver()
  }

  return (
    <html lang="zh-CN">
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Navigation />
          <NoiseOverlay />
          <MonitoringComponents />
          <main className="pt-16 pb-16">
            {children}
          </main>

          {/* 上下文状态栏 - 固定在底部 */}
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <ContextStatusBarPro
              theme={statusbarConfig.theme}
              showRefresh={statusbarConfig.showRefresh}
              showDiskUsage={statusbarConfig.showDiskUsage}
              showStats={statusbarConfig.showStats}
              showQuickActions={statusbarConfig.showQuickActions}
              currentFile={statusbarConfig.currentFile}
              fileContext={statusbarConfig.defaultFileContext}
              modelContext={statusbarConfig.defaultModelContext}
              tokensUsed={statusbarConfig.defaultTokensUsed}
              totalTokens={statusbarConfig.defaultTotalTokens}
            />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
