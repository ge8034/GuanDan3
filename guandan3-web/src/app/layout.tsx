import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/theme-context'
import NoiseOverlay from '@/components/effects/NoiseOverlay'
import Navigation from '@/components/Navigation'
import PerformanceSetup from '@/components/performance/PerformanceSetup'
import MonitoringComponents from '@/components/monitoring/MonitoringComponents'
import { PWAProvider, OfflineIndicator, UpdateBanner } from '@/components/pwa'

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
  return (
    <html lang="zh-CN">
      <body
        className="font-sans antialiased"
        suppressHydrationWarning
      >
        <PWAProvider>
          <ThemeProvider>
            <PerformanceSetup />
            <Navigation />
            <NoiseOverlay />
            <MonitoringComponents />
            <OfflineIndicator />
            <UpdateBanner />
            <main className="pt-16 pb-16">
              {children}
            </main>
          </ThemeProvider>
        </PWAProvider>
      </body>
    </html>
  )
}
