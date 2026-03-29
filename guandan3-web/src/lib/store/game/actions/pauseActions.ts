import { supabase } from '@/lib/supabase/client'
import { devError } from '@/lib/utils/devLog'
import type { GameState } from '../types'

/**
 * 暂停游戏
 */
export async function pauseGame(this: GameState, reason = ''): Promise<void> {
  const state = this
  if (!state.gameId) {
    devError('Cannot pause game: No game ID')
    return
  }

  if (state.status !== 'playing') {
    devError('Cannot pause game: Game is not in playing status')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    devError('Cannot pause game: User not authenticated')
    return
  }

  const { error } = await supabase.rpc('pause_game', {
    p_game_id: state.gameId,
    p_uid: user.id,
    p_reason: reason
  })

  if (error) {
    devError('Pause game failed:', error)
    throw error
  }

  // 更新本地状态
  state.setGame({
    status: 'paused',
    pausedBy: user.id,
    pausedAt: new Date().toISOString(),
    pauseReason: reason
  })
}

/**
 * 恢复游戏
 */
export async function resumeGame(this: GameState): Promise<void> {
  const state = this
  if (!state.gameId) {
    devError('Cannot resume game: No game ID')
    return
  }

  if (state.status !== 'paused') {
    devError('Cannot resume game: Game is not in paused status')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    devError('Cannot resume game: User not authenticated')
    return
  }

  const { error } = await supabase.rpc('resume_game', {
    p_game_id: state.gameId,
    p_uid: user.id
  })

  if (error) {
    devError('Resume game failed:', error)
    throw error
  }

  // 更新本地状态
  state.setGame({
    status: 'playing',
    pausedBy: null,
    pausedAt: null,
    pauseReason: null
  })
}
