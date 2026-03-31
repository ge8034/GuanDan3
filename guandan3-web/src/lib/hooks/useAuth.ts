import { useAuthStore } from '@/lib/store/auth'

/**
 * 认证状态 Hook
 *
 * 提供当前用户认证状态和用户信息的便捷访问。
 * 数据来源于全局认证 store。
 *
 * @returns 认证状态对象
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, loading } = useAuth()
 *
 *   if (!isAuthenticated) {
 *     return <div>请先登录</div>
 *   }
 *
 *   return (
 *     <div>
 *       欢迎, {user?.email || '玩家'}!
 *     </div>
 *   )
 * }
 * ```
 *
 * @example
 * ```tsx
 * // 使用用户 ID 进行查询
 * function UserProfile() {
 *   const { user, isAuthenticated } = useAuth()
 *
 *   useEffect(() => {
 *     if (isAuthenticated && user?.id) {
 *       fetchUserData(user.id)
 *     }
 *   }, [isAuthenticated, user])
 *
 *   return <div>...</div>
 * }
 * ```
 */
export function useAuth() {
  const { user, isAuthenticated } = useAuthStore()

  return {
    /** 当前用户对象，未登录时为 null */
    user,
    /** 是否已登录 */
    isAuthenticated,
    /** 加载状态，当前固定为 false（预留） */
    loading: false
  }
}
