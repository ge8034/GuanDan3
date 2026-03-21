import { useAuthStore } from '@/lib/store/auth'

export function useAuth() {
  const { user, isAuthenticated } = useAuthStore()
  
  return {
    user,
    isAuthenticated,
    loading: false
  }
}
