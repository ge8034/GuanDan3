import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/theme-context'
import NoiseOverlay from '@/components/effects/NoiseOverlay'
import Navigation from '@/components/Navigation'
import { setupResourcePreloading, setupPerformanceObserver } from '@/lib/performance/resource-optimizer'
import MonitoringComponents from '@/components/monitoring/MonitoringComponents'
// 暂时禁用 ContextStatusBarPro 以修复 SSR 问题
// import ContextStatusBarPro from '@/components/ContextStatusBarPro'
// import { statusbarConfig } from '@/config/statusbar'

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
        </ThemeProvider>
      </body>
    </html>
  )
}
