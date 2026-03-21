import type { Metadata } from 'next'
import { Noto_Serif_SC } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme/theme-context'
import NoiseOverlay from '@/components/effects/NoiseOverlay'
import Navigation from '@/components/Navigation'
import { setupResourcePreloading, setupPerformanceObserver } from '@/lib/performance/resource-optimizer'
import MonitoringComponents from '@/components/monitoring/MonitoringComponents'

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-serif-sc',
  preload: true,
})

export const metadata: Metadata = {
  title: '掼蛋 3',
  description: '在线掼蛋对战',
  manifest: '/manifest.json',
  themeColor: '#6BA539',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '掼蛋 3',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
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
        className={`${notoSerifSC.variable} font-serif antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <Navigation />
          <NoiseOverlay />
          <MonitoringComponents />
          <main className="pt-16">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
