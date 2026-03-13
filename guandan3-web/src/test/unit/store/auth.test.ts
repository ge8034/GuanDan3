import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/lib/store/auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('setUser会同步isAuthenticated状态', () => {
    const fakeUser: any = { id: 'u-1' }
    useAuthStore.getState().setUser(fakeUser)
    expect(useAuthStore.getState().user).toEqual(fakeUser)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().setUser(null)
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

