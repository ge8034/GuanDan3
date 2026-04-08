'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Button } from '@/design-system/components/atoms'
import { Badge } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'
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

// 战绩卡片组件 - 使用 Impeccable Design 规范
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
    <Card
      variant="elevated"
      padding="md"
      className={cn(
        'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg'
      )}
    >
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-base text-neutral-900 truncate">
              {roomName}
            </span>
            <Badge
              variant={mode === 'pve1v3' ? 'primary' : 'secondary'}
              size="sm"
            >
              {mode === 'pve1v3' ? '练习' : '对战'}
            </Badge>
          </div>
          <div className="text-sm text-neutral-500">
            {date}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              'text-xl font-bold',
              delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-neutral-500'
            )}
          >
            {delta > 0 ? '+' : ''}{delta}
          </div>
          <div className="text-xs text-neutral-400">
            积分: {totalAfter}
          </div>
        </div>
      </div>
    </Card>
  )
}

// 骨架屏组件
function RecordSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-20 bg-white/50 rounded-xl animate-pulse"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
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
        <div className="min-h-screen p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            {/* 头部骨架 */}
            <div className="h-16 bg-white/50 rounded-xl mb-6 animate-pulse" />
            <RecordSkeleton />
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  if (error) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card variant="elevated" padding="lg" className="max-w-lg w-full text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-bold mb-2">加载失败</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/lobby')} fullWidth>
              返回大厅
            </Button>
          </Card>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen p-4 md:p-8">
        {/* 头部 */}
        <header className="mb-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/lobby')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
            <div className="text-center flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                游戏战绩
              </h1>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* 内容区域 */}
        <main className="max-w-3xl mx-auto">
          {records.length > 0 ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {records.map((record, index) => (
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
            <Card
              variant="elevated"
              padding="lg"
              className="text-center animate-in fade-in duration-300"
            >
              <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
              <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                暂无战绩记录
              </h3>
              <p className="text-neutral-500 mb-6">
                完成游戏后将显示战绩记录
              </p>
              <Button onClick={() => router.push('/lobby')}>
                前往大厅
              </Button>
            </Card>
          )}
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}
