import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'

/**
 * 认证状态接口
 */
interface AuthState {
  /** 当前用户对象，未登录时为 null */
  user: User | null
  /** 设置用户并更新认证状态 */
  setUser: (user: User | null) => void
  /** 是否已登录 */
  isAuthenticated: boolean
}

/**
 * 认证状态 Store
 *
 * 使用 Zustand 管理全局认证状态，配合 persist 中间间
 * 将用户信息持久化到 localStorage。
 *
 * @example
 * ```ts
 * // 获取用户信息
 * const { user, isAuthenticated } = useAuthStore()
 * console.log(user?.id, isAuthenticated)
 *
 * // 设置用户（登录后）
 * useAuthStore.getState().setUser(supabaseUser)
 *
 * // 清除用户（登出）
 * useAuthStore.getState().setUser(null)
 * ```
 *
 * @remarks
 * - 使用 localStorage 持久化，key 为 'auth-storage'
 * - setUser 会自动同步更新 isAuthenticated 状态
 * - 在组件中建议通过 useAuth hook 访问
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
