'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { logger } from '@/lib/utils/logger'
import { Button } from '@/components/ui/Button'
import SpotlightCard, { SpotlightCardHeader, SpotlightCardBody } from '@/components/ui/SpotlightCard'
import FadeIn from '@/components/ui/FadeIn'
import ScaleIn from '@/components/ui/ScaleIn'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { MountainIcon, UserGroupIcon, LightningIcon, CheckCircleIcon, BookIcon } from '@/components/icons/LandscapeIcons'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useTheme } from '@/lib/theme/theme-context'

export default function Home() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { showToast, toastView } = useToast()

  useEffect(() => {
    setIsClient(true)
    // 设置全局调试变量
    ;(window as any).DEBUG = {
      supabase,
      useAuthStore,
      getSession: () => supabase.auth.getSession(),
      getUser: () => useAuthStore.getState().user
    }
    logger.debug('[DEBUG] 全局变量已设置，使用 window.DEBUG 访问')
  }, [])

  const handleLobbyEnter = async () => {
    setIsLoading(true)
    try {
      const storeUser = useAuthStore.getState().user
      if (!storeUser) {
        const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        if (!ok) return
      }
      router.push('/lobby')
    } finally {
      setIsLoading(false)
    }
  }

  const createPracticeRoom = async () => {
    setIsLoading(true)
    try {
      logger.debug('[DEBUG] 开始创建练习房间')

      // 确保认证
      let storeUser = useAuthStore.getState().user
      logger.debug('[DEBUG] storeUser:', storeUser)

      if (!storeUser) {
        logger.debug('[DEBUG] 用户未认证，调用ensureAuthed')
        const { ok, user } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        logger.debug('[DEBUG] ensureAuthed结果:', { ok, user })
        if (!ok || !user) return
        storeUser = user
      }

      // 确保用户ID存在
      const userId = storeUser.id
      if (!userId) {
        logger.error('[DEBUG] 用户ID不存在:', storeUser)
        showToast({ message: '用户认证信息异常，请重试', kind: 'error' })
        return
      }

      logger.debug('[DEBUG] 用户ID:', userId)

      // 明确传递用户ID作为参数
      const { data, error } = await supabase.rpc('create_practice_room', {
        p_visibility: 'private',
        p_user_id: userId
      })

      if (error) {
        logger.error('Create room failed:', error)
        showToast({ message: mapSupabaseErrorToMessage(error, '创建房间失败'), kind: 'error' })
        return
      }

      const roomId = data?.[0]?.room_id
      if (roomId) {
        router.push(`/room/${roomId}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <SimpleEnvironmentBackground>
        <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
           {toastView}
           <h1 className="text-4xl font-bold text-gray-900">掼蛋 3</h1>
           <div className="animate-pulse text-gray-600">加载中...</div>
        </main>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground>
      <ThemeSwitcher />
      <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 gap-12 lg:gap-20 2xl:gap-32">
        {toastView}
        
        <FadeIn delay={0.1}>
          <div className="text-center space-y-6 md:space-y-8">
            <div className="relative inline-block">
              <h1 className="text-6xl md:text-8xl 2xl:text-9xl font-bold tracking-tight text-text-primary" style={{ fontFamily: 'var(--font-noto-serif-sc)' }}>
                掼蛋
              </h1>
              <div className="absolute -top-4 -right-8 text-2xl font-serif italic text-accent opacity-80">叁</div>
            </div>
            <p className="text-lg md:text-xl text-text-secondary font-light tracking-wide max-w-md mx-auto leading-relaxed">
              智者博弈 · 经典传承
            </p>
          </div>
        </FadeIn>
        
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-5xl justify-center items-stretch">
          <ScaleIn delay={0.2} className="flex-1 max-w-md">
            <SpotlightCard hover className="h-full backdrop-blur-md shadow-xl border-border/50 bg-surface/60 group">
              <SpotlightCardBody className="flex flex-col h-full p-8 items-center text-center gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-primary/80 to-secondary/80 group-hover:scale-110 transition-transform duration-500">
                  <LightningIcon size="lg" className="text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text-primary">人机对弈</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    挑战高智商 AI 对手<br/>磨练牌技的最佳场所
                  </p>
                </div>
                <div className="mt-auto w-full pt-4">
                  <Button
                    onClick={createPracticeRoom}
                    isLoading={isLoading}
                    fullWidth
                    size="lg"
                    data-testid="home-practice"
                    className="shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-white font-medium tracking-wide"
                  >
                    开始练习
                  </Button>
                </div>
              </SpotlightCardBody>
            </SpotlightCard>
          </ScaleIn>
          
          <ScaleIn delay={0.3} className="flex-1 max-w-md">
            <SpotlightCard hover className="h-full backdrop-blur-md shadow-xl border-border/50 bg-surface/60 group">
              <SpotlightCardBody className="flex flex-col h-full p-8 items-center text-center gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-secondary/80 to-accent/80 group-hover:scale-110 transition-transform duration-500">
                  <UserGroupIcon size="lg" className="text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-text-primary">在线大厅</h2>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    与好友实时连线<br/>体验纯正掼蛋乐趣
                  </p>
                </div>
                <div className="mt-auto w-full pt-4">
                  <Button
                    onClick={handleLobbyEnter}
                    isLoading={isLoading}
                    variant="outline"
                    fullWidth
                    size="lg"
                    data-testid="home-enter-lobby"
                    className="border-2 border-primary text-primary hover:bg-primary/5 font-medium tracking-wide"
                  >
                    进入大厅
                  </Button>
                </div>
              </SpotlightCardBody>
            </SpotlightCard>
          </ScaleIn>
        </div>
        
        <FadeIn delay={0.4} direction="up">
          <div className="grid grid-cols-3 gap-8 md:gap-16 opacity-60">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs tracking-widest uppercase text-text-secondary">FAST</span>
              <span className="text-sm font-medium text-text-primary">极速匹配</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs tracking-widest uppercase text-text-secondary">FAIR</span>
              <span className="text-sm font-medium text-text-primary">公平竞技</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs tracking-widest uppercase text-text-secondary">FUN</span>
              <span className="text-sm font-medium text-text-primary">乐趣无穷</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.5} direction="up">
          <div className="mt-12 flex justify-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/rules')}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <BookIcon className="w-5 h-5 mr-2" />
              游戏规则
            </Button>
          </div>
        </FadeIn>
      </main>
    </SimpleEnvironmentBackground>
  )
}
