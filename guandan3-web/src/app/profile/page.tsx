/**
 * Profile 个人中心页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar, Button, Badge, Card } from '@/design-system/components/atoms'
import { Skeleton } from '@/design-system/components/molecules'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useAuthStore } from '@/lib/store/auth'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ScrollText, ArrowLeft, AlertTriangle } from 'lucide-react'
import { cn } from '@/design-system/utils/cn'

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

// 统计卡片组件
function StatCard({
  label,
  value,
  color = 'text-poker-table-700',
  delay = 0
}: {
  label: string
  value: number | string
  color?: string
  delay?: number
}) {
  return (
    <Card
      className={cn(
        'p-4 text-center',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-lg',
        'animate-fade-in'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn('text-2xl font-bold mb-1', color)}>
        {value}
      </div>
      <div className="text-sm text-neutral-600">{label}</div>
    </Card>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const authUser = useAuthStore.getState().user
        if (!authUser) {
          router.replace('/')
          return
        }

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
        <div className="min-h-screen p-4 pt-20">
          <div className="max-w-5xl mx-auto">
            <Skeleton variant="rect" className="h-20 w-full mb-6" />
            <Card className="p-8 mb-6">
              <div className="flex flex-col items-center gap-6">
                <Skeleton variant="circle" className="w-20 h-20" />
                <Skeleton variant="text" className="h-6 w-48" />
              </div>
            </Card>
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
        <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur-md border-b-2 border-black/10 animate-fade-in">
          <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-neutral-900">
              个人中心
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

        <main className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-6">
            {/* 用户信息卡片 */}
            <Card
              className={cn(
                'p-8 shadow-lg',
                'border-2',
                theme === 'poker' ? 'border-poker-table-600' : 'border-neutral-300',
                'animate-fade-in'
              )}
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex flex-col items-center gap-6">
                <Avatar
                  alt={user?.email || '玩家'}
                  size="xl"
                  className="w-20 h-20"
                />
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold mb-2 text-neutral-900">
                    {user?.email?.split('@')[0] || '玩家'}
                  </h2>
                  <p className="text-neutral-600 mb-4">{user?.email || 'demo@example.com'}</p>
                  <div className="flex gap-2 flex-wrap justify-center">
                    <Badge
                      variant="primary"
                      className="bg-poker-table-700"
                    >
                      等级 {Math.floor((stats?.totalScore || 0) / 100) + 1}
                    </Badge>
                    <Badge
                      variant="success"
                    >
                      {stats?.winRate || 0}% 胜率
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/friends')}
                    className="w-full"
                  >
                    好友管理
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/history')}
                    className="w-full"
                  >
                    查看战绩
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full text-error-500 hover:bg-error-500/10"
                  >
                    退出登录
                  </Button>
                </div>
              </div>
            </Card>

            {/* 统计数据 */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-neutral-900">
                游戏统计
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <StatCard label="总场次" value={stats?.totalGames || 0} delay={0} />
                <StatCard label="胜利" value={stats?.totalWins || 0} color="text-success-600" delay={50} />
                <StatCard label="失败" value={stats?.totalLosses || 0} color="text-error-600" delay={100} />
                <StatCard label="胜率" value={`${stats?.winRate || 0}%`} delay={150} />
                <StatCard label="当前积分" value={stats?.totalScore || 0} color="text-amber-600" delay={200} />
                <StatCard label="最高积分" value={stats?.bestScore || 0} delay={250} />
              </div>
            </div>

            {/* 最近战绩 */}
            {recentRecords.length > 0 && (
              <Card
                className={cn(
                  'shadow-lg',
                  'border-2',
                  theme === 'poker' ? 'border-poker-table-600' : 'border-neutral-300',
                  'animate-fade-in overflow-hidden'
                )}
                style={{ animationDelay: '300ms' }}
              >
                <div className="p-6 border-b-2 border-black/10">
                  <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                    <ScrollText className="w-6 h-6" />
                    最近战绩
                  </h3>
                </div>

                <div>
                  {recentRecords.slice(0, 10).map((record, index) => (
                    <div
                      key={record.id}
                      className={cn(
                        'px-6 py-4 flex justify-between items-center',
                        'transition-colors duration-150',
                        'hover:bg-black/5',
                        index < Math.min(recentRecords.length, 10) - 1 && 'border-b border-black/10'
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-1 text-neutral-900 flex items-center gap-2 flex-wrap">
                          {record.game.room.name}
                          <Badge
                            variant={record.game.room.mode === 'pve1v3' ? 'primary' : 'secondary'}
                            size="sm"
                            className={cn(
                              record.game.room.mode === 'pve1v3' ? 'bg-blue-500' : 'bg-poker-table-700'
                            )}
                          >
                            {record.game.room.mode === 'pve1v3' ? '练习' : '对战'}
                          </Badge>
                        </div>
                        <div className="text-sm text-neutral-600">
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={cn(
                            'text-xl font-bold',
                            record.delta > 0 ? 'text-success-600' : record.delta < 0 ? 'text-error-600' : 'text-neutral-600'
                          )}
                        >
                          {record.delta > 0 ? '+' : ''}{record.delta}
                        </div>
                        <div className="text-xs text-neutral-400">
                          积分: {record.total_after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t-2 border-black/10">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/history')}
                    className="w-full"
                  >
                    查看全部战绩
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out both;
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
