'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptRoomInvitation } from '@/lib/api/roomInvitation'
import { useAuth } from '@/lib/hooks/useAuth'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'

export default function InvitePage({ params }: { params: { inviteCode: string } }) {
  const router = useRouter()
  const { theme } = useTheme()
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
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'white', fontSize: '1.25rem' }}>加载中...</div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            border: '1px solid ' + 'rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '2.5rem' }}>📨</span>
            </div>

            <div>
              <h1
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '0.5rem',
                }}
              >
                房间邀请
              </h1>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {success ? '正在跳转到房间...' : '您被邀请加入一个掼蛋房间'}
              </p>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <p style={{ color: '#fecaca', fontSize: '0.875rem' }}>{error}</p>
              </div>
            )}

            {success ? (
              <div
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid ' + 'rgba(34, 197, 94, 0.5)',
                  borderRadius: '8px',
                  padding: '1rem',
                }}
              >
                <p style={{ color: '#bbf7d0', fontSize: '0.875rem' }}>✓ 已成功加入房间</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button
                  onClick={handleAcceptInvitation}
                  disabled={loading}
                  style={{
                    width: '100%',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#3b82f6'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = '#2563eb'
                    }
                  }}
                >
                  {loading ? '处理中...' : '接受邀请'}
                </button>

                <button
                  onClick={() => router.push('/lobby')}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  }}
                >
                  返回大厅
                </button>
              </div>
            )}

            <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.75rem' }}>
              <p>邀请码: {params.inviteCode}</p>
            </div>
          </div>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
