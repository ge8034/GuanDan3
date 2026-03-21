import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAuthStore } from '@/lib/store/auth'

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  }
}))

describe('端到端用户流程测试', () => {
  beforeEach(() => {
    useAuthStore.getState().setUser({
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { username: 'testuser' }
    } as any)
  })

  afterEach(() => {
    useAuthStore.getState().setUser(null)
  })

  describe('认证流程', () => {
    it('应该能够设置用户状态', () => {
      const { setUser } = useAuthStore.getState()

      setUser({
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { username: 'testuser' }
      } as any)

      const state = useAuthStore.getState()
      expect(state.user).toBeDefined()
      expect(state.isAuthenticated).toBe(true)
    })

    it('应该能够清除用户状态', () => {
      const { setUser } = useAuthStore.getState()

      setUser(null)

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('应该能够验证用户登录状态', () => {
      const { setUser } = useAuthStore.getState()

      setUser({
        id: 'logged-in-user',
        email: 'user@example.com',
        user_metadata: { username: 'loggedin' }
      } as any)

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email).toBe('user@example.com')
    })
  })

  describe('用户会话管理', () => {
    it('应该能够更新用户信息', () => {
      const { setUser } = useAuthStore.getState()

      setUser({
        id: 'user-1',
        email: 'old@example.com',
        user_metadata: { username: 'olduser' }
      } as any)

      const state1 = useAuthStore.getState()
      expect(state1.user?.email).toBe('old@example.com')

      setUser({
        id: 'user-1',
        email: 'new@example.com',
        user_metadata: { username: 'newuser' }
      } as any)

      const state2 = useAuthStore.getState()
      expect(state2.user?.email).toBe('new@example.com')
    })

    it('应该能够处理用户登出', () => {
      const { setUser } = useAuthStore.getState()

      setUser({
        id: 'user-logout',
        email: 'logout@example.com',
        user_metadata: { username: 'logoutuser' }
      } as any)

      const state1 = useAuthStore.getState()
      expect(state1.isAuthenticated).toBe(true)

      setUser(null)

      const state2 = useAuthStore.getState()
      expect(state2.isAuthenticated).toBe(false)
      expect(state2.user).toBeNull()
    })
  })

  describe('用户数据完整性', () => {
    it('应该能够保持用户ID一致性', () => {
      const { setUser } = useAuthStore.getState()

      const userId = 'consistent-user-id'
      setUser({
        id: userId,
        email: 'consistent@example.com',
        user_metadata: { username: 'consistent' }
      } as any)

      const state = useAuthStore.getState()
      expect(state.user?.id).toBe(userId)
    })

    it('应该能够处理用户元数据', () => {
      const { setUser } = useAuthStore.getState()

      const metadata = {
        username: 'metadatatest',
        avatar: 'avatar-url',
        level: 5
      }

      setUser({
        id: 'metadata-user',
        email: 'metadata@example.com',
        user_metadata: metadata
      } as any)

      const state = useAuthStore.getState()
      expect(state.user?.user_metadata).toEqual(metadata)
    })
  })

  describe('认证状态转换', () => {
    it('应该能够从未认证转换到已认证', () => {
      const { setUser } = useAuthStore.getState()

      setUser(null)

      let state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)

      setUser({
        id: 'transition-user',
        email: 'transition@example.com',
        user_metadata: { username: 'transition' }
      } as any)

      state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
    })

    it('应该能够从已认证转换到未认证', () => {
      const { setUser } = useAuthStore.getState()

      setUser({
        id: 'transition-user-2',
        email: 'transition2@example.com',
        user_metadata: { username: 'transition2' }
      } as any)

      let state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)

      setUser(null)

      state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })
})
