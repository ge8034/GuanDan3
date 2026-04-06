'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Button } from '@/components/ui/Button'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import FadeIn from '@/components/ui/FadeIn'
import ScaleIn from '@/components/ui/ScaleIn'
import { StaggerContainer } from '@/components/ui/StaggerContainer.lazy'
import CloudMountainBackground from '@/components/backgrounds/CloudMountainBackground'

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

export default function ProfilePage() {
  const router = useRouter()
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
      <CloudMountainBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center relative z-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6BA539] border-t-transparent"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        </div>
      </CloudMountainBackground>
    )
  }

  if (error) {
    return (
      <CloudMountainBackground>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] relative z-10">
            <CardBody>
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">加载失败</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => router.push('/lobby')} className="w-full">
                  返回大厅
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </CloudMountainBackground>
    )
  }

  return (
    <CloudMountainBackground>
      <div className="min-h-screen">
        <FadeIn delay={0.1}>
        <header className="bg-[#F5F5DC]/90 backdrop-blur-sm border-b border-[#D3D3D3] sticky top-0 z-10 relative">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A4A0A]">
              个人中心
            </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/lobby')}
              className="hidden md:block"
            >
              返回大厅
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/lobby')}
              className="md:hidden"
            >
              返回
            </Button>
          </div>
          </div>
        </header>
      </FadeIn>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8 relative z-10">
        <div className="grid gap-6 md:gap-8">
          <ScaleIn delay={0.2}>
            <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardBody className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar
                  name={user?.user_metadata?.nickname || user?.email || '用户'}
                  size="xl"
                  className="w-24 h-24 md:w-32 md:h-32"
                />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {user?.user_metadata?.nickname || '玩家'}
                  </h2>
                  <p className="text-gray-700 mb-4">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    <Badge variant="primary" size="md">
                      等级 {Math.floor((stats?.totalScore || 0) / 100) + 1}
                    </Badge>
                    <Badge variant="success" size="md">
                      {stats?.winRate || 0}% 胜率
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/friends')}
                    className="w-full md:w-auto"
                  >
                    好友管理
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/history')}
                    className="w-full md:w-auto"
                  >
                    查看战绩
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleLogout}
                    className="w-full md:w-auto"
                  >
                    退出登录
                  </Button>
                </div>
              </div>
            </CardBody>
            </Card>
          </ScaleIn>

          <StaggerContainer staggerDelay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <ScaleIn delay={0.3}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#2D5A1D] mb-1">
                  {stats?.totalGames || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-600">总场次</div>
              </CardBody>
                </Card>
              </ScaleIn>

              <ScaleIn delay={0.35}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-1">
                  {stats?.totalWins || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-700">胜利</div>
              </CardBody>
                </Card>
              </ScaleIn>

              <ScaleIn delay={0.4}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-red-700 mb-1">
                  {stats?.totalLosses || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-700">失败</div>
              </CardBody>
                </Card>
              </ScaleIn>

              <ScaleIn delay={0.45}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#2D5A1D] mb-1">
                  {stats?.winRate || 0}%
                </div>
                <div className="text-xs md:text-sm text-gray-700">胜率</div>
              </CardBody>
                </Card>
              </ScaleIn>

              <ScaleIn delay={0.5}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-700 mb-1">
                  {stats?.totalScore || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-700">当前积分</div>
              </CardBody>
                </Card>
              </ScaleIn>

              <ScaleIn delay={0.55}>
                <Card hover className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardBody className="p-4 text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#1A4A0A] mb-1">
                  {stats?.bestScore || 0}
                </div>
                <div className="text-xs md:text-sm text-gray-700">最高积分</div>
              </CardBody>
                </Card>
              </ScaleIn>
            </div>
          </StaggerContainer>

          <FadeIn delay={0.6}>
            <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-lg">
            <CardHeader className="border-[#D3D3D3]">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl">📜</span>
                最近战绩
              </h3>
            </CardHeader>
            <CardBody className="p-0">
              {recentRecords.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📭</div>
                  <div className="text-xl text-gray-700">暂无战绩</div>
                  <p className="mt-2 text-sm text-gray-600">快去完成一局游戏吧！</p>
                </div>
              ) : (
                <div className="divide-y divide-[#D3D3D3]/50">
                  {recentRecords.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="p-4 hover:bg-[#A8C8A8]/20 transition-colors flex justify-between items-center"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-2 flex-wrap">
                          {record.game.room.name || '未知房间'}
                          <Badge
                            variant={record.game.room.mode === 'pve1v3' ? 'info' : 'primary'}
                            size="sm"
                          >
                            {record.game.room.mode === 'pve1v3' ? '练习' : '对战'}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(record.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div
                          className={`text-2xl font-bold ${
                            record.delta > 0
                              ? 'text-green-600'
                              : record.delta < 0
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {record.delta > 0 ? '+' : ''}
                          {record.delta}
                        </div>
                        <div className="text-xs text-gray-500">
                          积分: {record.total_after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
            {recentRecords.length > 10 && (
              <CardFooter className="border-[#D3D3D3]">
                <Button
                  variant="outline"
                  onClick={() => router.push('/history')}
                  className="w-full"
                >
                  查看全部战绩
                </Button>
              </CardFooter>
            )}
            </Card>
          </FadeIn>
        </div>
      </main>
      </div>
    </CloudMountainBackground>
  )
}
