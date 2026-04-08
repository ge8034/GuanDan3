'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Avatar } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { ScrollText, Inbox, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react'

import { logger } from '@/lib/utils/logger'

type GameRecord = {
  id: string
  created_at: string
  delta: number
  total_after: number
  game: {
    room: {
      name: string
      mode: string
    }
  }
}

// 模拟数据
const mockRecords = [
  { id: '1', roomName: '快乐牌局', mode: '对战', delta: 50, totalAfter: 1250, date: '2026/4/8 14:30' },
  { id: '2', roomName: '练习房', mode: '练习', delta: 30, totalAfter: 1200, date: '2026/4/8 12:15' },
  { id: '3', roomName: '高手对决', mode: '对战', delta: -20, totalAfter: 1170, date: '2026/4/8 10:00' },
  { id: '4', roomName: '新手练习', mode: '练习', delta: 45, totalAfter: 1190, date: '2026/4/7 20:30' },
  { id: '5', roomName: '友谊赛', mode: '对战', delta: 60, totalAfter: 1145, date: '2026/4/7 18:00' },
  { id: '6', roomName: '每日挑战', mode: '练习', delta: 25, totalAfter: 1085, date: '2026/4/7 15:20' },
  { id: '7', roomName: '竞技场', mode: '对战', delta: -15, totalAfter: 1060, date: '2026/4/7 12:00' },
]

// 战绩卡片组件
function RecordCard({
  roomName,
  mode,
  delta,
  totalAfter,
  date
}: {
  roomName: string
  mode: string
  delta: number
  totalAfter: number
  date: string
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {roomName}
            <span
              style={{
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: mode === 'pve1v3' ? '#3b82f6' : '#1a472a',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 500
              }}
            >
              {mode === 'pve1v3' ? '练习' : '对战'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {date}
          </div>
        </div>
        <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : '#6b7280'
            }}
          >
            {delta > 0 ? '+' : ''}{delta}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            积分: {totalAfter}
          </div>
        </div>
      </div>
    </div>
  )
}

// 骨架屏组件
function RecordSkeleton() {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        padding: '1rem',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            height: '20px',
            width: '150px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            marginBottom: '0.5rem'
          }} />
          <div style={{
            height: '14px',
            width: '200px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px'
          }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            height: '24px',
            width: '60px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '4px',
            marginLeft: 'auto',
            marginBottom: '0.25rem'
          }} />
          <div style={{
            height: '12px',
            width: '80px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: '4px',
            marginLeft: 'auto'
          }} />
        </div>
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [records, setRecords] = useState<GameRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace('/')
          return
        }

        const { data, error } = await supabase
          .from('scores')
          .select(`
            id,
            created_at,
            delta,
            total_after,
            game:games (
              room:rooms (
                name,
                mode
              )
            )
          `)
          .eq('uid', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        setRecords(data as unknown as GameRecord[])
      } catch (e: any) {
        logger.error('Fetch records error:', e)
        setError(mapSupabaseErrorToMessage(e, '加载战绩失败'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecords()
  }, [router])

  if (isLoading) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', padding: '1rem', paddingTop: '64px' }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            {/* 头部骨架 */}
            <div style={{
              height: '60px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[1, 2, 3, 4, 5].map(i => <RecordSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  if (error) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              maxWidth: '32rem',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <AlertTriangle style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>加载失败</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => router.push('/lobby')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #1a472a',
                backgroundColor: '#1a472a',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d5a3d'
                e.currentTarget.style.borderColor = '#2d5a3d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a472a'
                e.currentTarget.style.borderColor = '#1a472a'
              }}
            >
              返回大厅
            </button>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
        {/* 头部 */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(245, 245, 220, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ScrollText style={{ width: '32px', height: '32px' }} />
              游戏战绩
            </h1>
            <button
              onClick={() => router.push('/lobby')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.borderColor = '#d4af37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回大厅
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main style={{ maxWidth: '64rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          {records.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {records.map((record) => (
                <RecordCard
                  key={record.id}
                  roomName={record.game.room.name}
                  mode={record.game.room.mode}
                  delta={record.delta}
                  totalAfter={record.total_after}
                  date={new Date(record.created_at).toLocaleDateString()}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '2px solid #e5e7eb',
                padding: '3rem',
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Inbox style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#9ca3af' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.5rem' }}>
                暂无战绩记录
              </h3>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                完成游戏后将显示战绩记录
              </p>
              <button
                onClick={() => router.push('/lobby')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '2px solid #1a472a',
                  backgroundColor: '#1a472a',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d5a3d'
                  e.currentTarget.style.borderColor = '#2d5a3d'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1a472a'
                  e.currentTarget.style.borderColor = '#1a472a'
                }}
              >
                前往大厅
              </button>
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
