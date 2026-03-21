'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import ThemeSelector from '@/components/theme/ThemeSelector'

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: '首页' },
    { href: '/lobby', label: '大厅' },
    { href: '/friends', label: '好友' },
    { href: '/chat', label: '聊天' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-text-primary">
            掼蛋 3
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-primary/10 text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <ThemeSelector />
          </div>
        </div>
      </div>
    </nav>
  )
}
