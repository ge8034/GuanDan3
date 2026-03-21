'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { acceptRoomInvitation } from '@/lib/api/roomInvitation'
import { useAuth } from '@/lib/hooks/useAuth'
import RippleEffect from '@/components/effects/RippleEffect'

export default function InvitePage({ params }: { params: { inviteCode: string } }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleAcceptInvitation = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const { data, error: inviteError } = await acceptRoomInvitation(params.inviteCode)

      if (inviteError) {
        setError(inviteError)
        return
      }

      if (data) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/room/${data.room_id}`)
        }, 1500)
      }
    } catch (err) {
      setError('接受邀请失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl"
      >
        <div className="text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-4xl">📨</span>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-white mb-2">房间邀请</h1>
            <p className="text-white/70">
              {success ? '正在跳转到房间...' : '您被邀请加入一个掼蛋房间'}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 rounded-lg p-4"
            >
              <p className="text-red-200 text-sm">{error}</p>
            </motion.div>
          )}

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/50 rounded-lg p-4"
            >
              <p className="text-green-200 text-sm">✓ 已成功加入房间</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <RippleEffect className="relative inline-block">
                <button
                  onClick={handleAcceptInvitation}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors"
                >
                  {loading ? '处理中...' : '接受邀请'}
                </button>
              </RippleEffect>

              <RippleEffect className="relative inline-block">
                <button
                  onClick={() => router.push('/lobby')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  返回大厅
                </button>
              </RippleEffect>
            </div>
          )}

          <div className="text-white/50 text-xs">
            <p>邀请码: {params.inviteCode}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
