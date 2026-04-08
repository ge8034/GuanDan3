'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme/theme-context'
import { GameTheme, ThemeMode } from '@/lib/theme/theme-types'
import { Palette, Sun, Moon, Settings2, ChevronDown } from 'lucide-react'

interface ModeOption {
  id: ThemeMode
  name: string
  icon: React.ReactNode
}

export default function ThemeSelector() {
  const { mode, gameTheme, setMode, setGameTheme, currentTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const gameThemes: Array<{ id: GameTheme; name: string; description: string }> = [
    { id: 'classic', name: '雅致经典', description: '新中式水墨风格' },
    { id: 'modern', name: '现代主题', description: '简洁现代风格' },
    { id: 'retro', name: '复古主题', description: '怀旧像素风格' }
  ]

  const modeOptions: ModeOption[] = [
    { id: 'light', name: '浅色', icon: <Sun style={{ width: '20px', height: '20px' }} /> },
    { id: 'dark', name: '深色', icon: <Moon style={{ width: '20px', height: '20px' }} /> },
    { id: 'auto', name: '自动', icon: <Settings2 style={{ width: '20px', height: '20px' }} /> }
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 1rem',
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
        aria-label={`当前主题：${currentTheme.name}，点击切换主题`}
        aria-expanded={isOpen}
      >
        <Palette style={{ width: '20px', height: '20px' }} strokeWidth={2} />
        <span>{currentTheme.name}</span>
        <ChevronDown
          style={{
            width: '16px',
            height: '16px',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '0.5rem',
            width: '320px',
            backgroundColor: 'white',
            borderRadius: '12px',
            border: '2px solid #e5e7eb',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
            zIndex: 1001,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onMouseLeave={() => setIsOpen(false)}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
            游戏主题
          </h3>
          <div style={{ marginBottom: '1.5rem' }}>
            {gameThemes.map((themeOption) => {
              const isSelected = gameTheme === themeOption.id
              return (
                <button
                  key={themeOption.id}
                  onClick={() => {
                    setGameTheme(themeOption.id)
                    setIsOpen(false)
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
                    marginBottom: '0.5rem',
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

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
            显示模式
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {modeOptions.map((option) => {
              const isSelected = mode === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setMode(option.id)}
                  style={{
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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    minHeight: '72px',
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
                  aria-label={`切换到${option.name}模式`}
                >
                  {option.icon}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{option.name}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
