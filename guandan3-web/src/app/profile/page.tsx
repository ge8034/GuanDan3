'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Button } from '@/design-system/components/atoms'
import { Badge } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { Avatar } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { AlertTriangle, ScrollText, ArrowLeft, Loader2 } from 'lucide-react'
import { tokens } from '@/design-system/tokens'

type UserProfile = {
  id: string
  email: string
  user_metadata: {
    nickname?: string
    avatar_url?: string
  }
}

type GameStats = {
  totalGames: number
  totalWins: number
  totalLosses: number
  winRate: number
  totalScore: number
  bestScore: number
}

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

// 统计卡片组件 - 使用 Impeccable Design 规范
function StatCard({
  label,
  value,
  variant = 'default',
  delay = 0
}: {
  label: string
  value: number | string
  variant?: 'default' | 'success' | 'error' | 'warning'
  delay?: number
}) {
  const colorMap = {
    default: 'text-neutral-900',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning',
  }

  return (
    <Card
      variant="elevated"
      padding="md"
      className={cn(
        'text-center transition-all duration-200 hover:-translate-y-1',
        'animate-in fade-in slide-in-from-bottom-4'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('text-2xl font-bold mb-1', colorMap[variant])}>
        {value}
      </div>
      <div className="text-sm text-neutral-600">
        {label}
      </div>
    </Card>
  )
}

// 骨架屏组件 - 使用 Tailwind
function ProfileSkeleton() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 头部骨架 */}
        <div className="h-20 bg-white/50 rounded-xl mb-6 animate-pulse" />

        {/* 用户信息骨架 */}
        <div className="bg-white/50 rounded-xl p-8 mb-6 flex gap-6 items-center animate-pulse">
          <div className="w-20 h-20 rounded-full bg-neutral-200" />
          <div className="flex-1">
            <div className="h-6 bg-neutral-200 rounded mb-3 w-40" />
            <div className="h-4 bg-neutral-200 rounded w-64" />
          </div>
        </div>

        {/* 统计骨架 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white/50 rounded-xl animate-pulse"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<GameStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.replace('/')
          return
        }

        setUser(authUser as UserProfile)

        const { data: records, error: recordsError } = await supabase
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
          .eq('uid', authUser.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (recordsError) throw recordsError

        const gameRecords = records as any
        setRecentRecords(gameRecords)

        const totalGames = gameRecords.length
        const totalWins = gameRecords.filter((r: GameRecord) => r.delta > 0).length
        const totalLosses = gameRecords.filter((r: GameRecord) => r.delta < 0).length
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
        const totalScore = gameRecords.length > 0 ? gameRecords[0].total_after : 0
        const bestScore = gameRecords.length > 0 ? Math.max(...gameRecords.map((r: GameRecord) => r.total_after)) : 0

        setStats({
          totalGames,
          totalWins,
          totalLosses,
          winRate,
          totalScore,
          bestScore,
        })
      } catch (e: any) {
        console.error(e)
        setError(mapSupabaseErrorToMessage(e, '获取用户信息失败'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div className="min-h-screen flex items-center justify-center">
          <ProfileSkeleton />
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
      <div className="min-h-screen">
        {/* 头部 - 使用 sticky 和 backdrop */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b-2 border-neutral-200 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
              个人中心
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/lobby')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
          {/* 用户信息卡片 */}
          <Card
            variant="elevated"
            padding="lg"
            className="animate-in fade-in slide-in-from-top-4 duration-200"
          >
            <div className="flex flex-col items-center gap-6">
              <Avatar
                alt={user?.user_metadata?.nickname || user?.email || '用户'}
                size="xl"
                className="w-20 h-20"
              />
              <div className="flex-1 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-neutral-900 mb-1">
                  {user?.user_metadata?.nickname || '玩家'}
                </h2>
                <p className="text-neutral-600 text-sm mb-3">{user?.email}</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Badge variant="primary" size="md">
                    等级 {Math.floor((stats?.totalScore || 0) / 100) + 1}
                  </Badge>
                  <Badge variant="success" size="md">
                    {stats?.winRate || 0}% 胜率
                  </Badge>
                </div>
              </div>
            </div>

            {/* 操作按钮组 */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/friends')}
                fullWidth
                size="sm"
              >
                好友管理
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/history')}
                fullWidth
                size="sm"
              >
                查看战绩
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                fullWidth
                size="sm"
                className="text-error border-error hover:bg-error/5"
              >
                退出登录
              </Button>
            </div>
          </Card>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <StatCard label="总场次" value={stats?.totalGames || 0} delay={0} />
            <StatCard label="胜利" value={stats?.totalWins || 0} variant="success" delay={50} />
            <StatCard label="失败" value={stats?.totalLosses || 0} variant="error" delay={100} />
            <StatCard label="胜率" value={`${stats?.winRate || 0}%`} delay={150} />
            <StatCard label="当前积分" value={stats?.totalScore || 0} variant="warning" delay={200} />
            <StatCard label="最高积分" value={stats?.bestScore || 0} delay={250} />
          </div>

          {/* 最近战绩 */}
          {recentRecords.length > 0 && (
            <Card
              variant="elevated"
              padding="lg"
              className="animate-in fade-in slide-in-from-bottom-4 duration-300 delay-200"
            >
              <div className="flex items-center gap-2 mb-4">
                <ScrollText className="w-5 h-5 text-accent-gold" />
                <h3 className="text-lg font-bold text-neutral-900">最近战绩</h3>
              </div>
              <div className="space-y-3">
                {recentRecords.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-neutral-900 truncate">
                        {record.game.room.name}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={record.delta > 0 ? 'success' : 'error'}
                      size="sm"
                    >
                      {record.delta > 0 ? '+' : ''}{record.delta}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}
