'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/theme/theme-context'
import { Palette, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function Navigation() {
  const pathname = usePathname()
  const { theme, currentTheme } = useTheme()
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  const navItems = [
    { href: '/home-demo', label: '演示' },
    { href: '/lobby-demo', label: '大厅' },
    { href: '/friends-demo', label: '好友' },
    { href: '/chat-demo', label: '聊天' },
  ]

  const gameThemes = [
    { id: 'classic', name: '雅致经典', description: '新中式水墨风格' },
    { id: 'modern', name: '现代主题', description: '简洁现代风格' },
    { id: 'retro', name: '复古主题', description: '怀旧像素风格' }
  ]

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderBottom: '2px solid ' + (theme === 'poker' ? '#2d5a3d' : '#d1d5db'),
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        <Link
          href="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#1a472a',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          掼蛋 3
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* 导航链接 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid ' + (
                      isActive
                        ? '#d4af37'
                        : 'transparent'
                    ),
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    color: isActive ? '#d4af37' : '#4b5563',
                    backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    minHeight: '44px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                      e.currentTarget.style.borderColor = '#2d5a3d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* 主题选择器 */}
          <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
                e.currentTarget.style.borderColor = '#d4af37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white'
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            >
              <Palette style={{ width: '16px', height: '16px' }} />
              <span>{currentTheme.name}</span>
              <ChevronDown
                style={{
                  width: '14px',
                  height: '14px',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isThemeOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>

            {/* 主题下拉菜单 */}
            {isThemeOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  width: '240px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  padding: '0.75rem',
                  zIndex: 1001,
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>
                  游戏主题
                </h4>
                {gameThemes.map((themeOption) => {
                  const isSelected = theme === themeOption.id
                  return (
                    <button
                      key={themeOption.id}
                      onClick={() => {
                        // 切换主题逻辑
                        setIsThemeOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '2px solid ' + (
                          isSelected
                            ? '#d4af37'
                            : 'transparent'
                        ),
                        backgroundColor: isSelected
                          ? 'rgba(212, 175, 55, 0.1)'
                          : 'transparent',
                        color: isSelected ? '#d4af37' : '#374151',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                        marginBottom: '0.25rem',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f9fafb'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>{themeOption.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                        {themeOption.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </nav>
  )
}
