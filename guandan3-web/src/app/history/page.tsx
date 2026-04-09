/**
 * History 游戏战绩页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Avatar, Button, Badge, Card } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { ScrollText, Inbox, ArrowLeft, AlertTriangle } from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { cn } from '@/design-system/utils/cn'

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
    <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="p-4 flex justify-between items-center">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-base mb-2 text-neutral-900 flex items-center gap-2 flex-wrap">
            {roomName}
            <Badge
              variant={mode === 'pve1v3' ? 'primary' : 'secondary'}
              size="sm"
              className={cn(mode === 'pve1v3' ? 'bg-blue-500' : 'bg-poker-table-700')}
            >
              {mode === 'pve1v3' ? '练习' : '对战'}
            </Badge>
          </div>
          <div className="text-sm text-neutral-600">
            {date}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className={cn(
            'text-xl font-bold',
            delta > 0 ? 'text-success-600' : delta < 0 ? 'text-error-600' : 'text-neutral-600'
          )}>
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
        <div className="min-h-screen p-4 pt-20">
          <div className="max-w-4xl mx-auto">
            <div className="h-16 w-full mb-6 bg-white/50 rounded-lg border-2 border-neutral-200 animate-pulse" />
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-white/50 rounded-lg border-2 border-neutral-200 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  if (error) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center bg-white/90 backdrop-blur-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h2 className="text-xl font-bold mb-2 text-neutral-900">加载失败</h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button
              onClick={() => router.push('/lobby')}
              variant="primary"
              className="w-full"
            >
              返回大厅
            </Button>
          </Card>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen pt-20">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur-md border-b-2 border-black/10">
          <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-3">
              <ScrollText className="w-8 h-8" />
              游戏战绩
            </h1>
            <Button
              onClick={() => router.push('/lobby')}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          {records.length > 0 ? (
            <div className="flex flex-col gap-4">
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
            <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-12 text-center">
              <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
              <h3 className="text-lg font-semibold text-neutral-600 mb-2">
                暂无战绩记录
              </h3>
              <p className="text-sm text-neutral-400 mb-6">
                完成游戏后将显示战绩记录
              </p>
              <Button
                onClick={() => router.push('/lobby')}
                variant="primary"
              >
                前往大厅
              </Button>
            </Card>
          )}
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}
