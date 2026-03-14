'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'

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

  return (
    <div className="min-h-screen bg-green-800 text-white p-4">
      <header className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <span className="text-4xl">📜</span> 战绩记录
        </h1>
        <button
          onClick={() => router.push('/lobby')}
          className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
        >
          返回大厅
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center py-12">加载中...</div>
        ) : error ? (
          <div className="bg-red-500/50 p-4 rounded text-center">{error}</div>
        ) : records.length === 0 ? (
          <div className="text-center py-12 bg-black/20 rounded-xl">
            <div className="text-6xl mb-4">📭</div>
            <div className="text-xl opacity-70">暂无战绩</div>
            <p className="mt-2 text-sm opacity-50">快去完成一局游戏吧！</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {records.map(record => (
              <div 
                key={record.id}
                className="bg-black/20 hover:bg-black/30 transition p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-lg mb-1">
                    {record.game.room.name || '未知房间'} 
                    <span className="text-xs bg-black/30 px-2 py-0.5 rounded ml-2 font-normal opacity-70">
                      {record.game.room.mode === 'pve1v3' ? '练习' : '对战'}
                    </span>
                  </div>
                  <div className="text-sm opacity-60">
                    {new Date(record.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-bold ${record.delta > 0 ? 'text-yellow-400' : record.delta < 0 ? 'text-gray-400' : 'text-white'}`}>
                    {record.delta > 0 ? '+' : ''}{record.delta}
                  </div>
                  <div className="text-xs opacity-50">
                    当前积分: {record.total_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
