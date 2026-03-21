'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { Button } from '@/components/ui/Button'
import Card, { CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import CloudMountainBackground from '@/components/backgrounds/CloudMountainBackground'

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

export default function HistoryPage() {
  const router = useRouter()
  const [records, setRecords] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHistory = async () => {
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
        setRecords(data as any)
      } catch (e: any) {
        console.error(e)
        setError(mapSupabaseErrorToMessage(e, '获取战绩失败'))
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  const renderRecordCard = useCallback((record: GameRecord) => (
    <Card 
      key={record.id}
      hover
      className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3] shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <CardBody className="p-4 flex justify-between items-center">
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
          <div className="text-sm text-gray-700">
            {new Date(record.created_at).toLocaleString('zh-CN')}
          </div>
        </div>
        <div className="text-right ml-4">
          <div className={`text-2xl font-bold ${
            record.delta > 0 ? 'text-green-700' : 
            record.delta < 0 ? 'text-red-700' : 'text-gray-700'
          }`}>
            {record.delta > 0 ? '+' : ''}{record.delta}
          </div>
          <div className="text-xs text-gray-700">
            当前积分: {record.total_after}
          </div>
        </div>
      </CardBody>
    </Card>
  ), [])

  return (
    <CloudMountainBackground>
      <header className="bg-[#F5F5DC]/90 backdrop-blur-sm border-b border-[#D3D3D3] sticky top-0 z-10 relative">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-[#1A4A0A] flex items-center gap-2">
            <span className="text-3xl md:text-4xl">📜</span>
            战绩记录
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/lobby')}
          >
            返回大厅
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8 relative z-10">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#6BA539] border-t-transparent"></div>
            <p className="mt-4 text-gray-700">加载中...</p>
          </div>
        ) : error ? (
          <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
            <CardBody>
              <div className="text-center text-red-700">{error}</div>
            </CardBody>
          </Card>
        ) : records.length === 0 ? (
          <Card className="bg-[#F5F5DC]/80 backdrop-blur-sm border-[#D3D3D3]">
            <CardBody>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <div className="text-xl text-gray-800">暂无战绩</div>
                <p className="mt-2 text-sm text-gray-700">快去完成一局游戏吧！</p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-4">
            {records.map(renderRecordCard)}
          </div>
        )}
      </main>
    </CloudMountainBackground>
  )
}
