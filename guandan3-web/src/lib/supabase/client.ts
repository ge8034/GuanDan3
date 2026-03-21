import { createOptimizedClient, type OptimizedSupabaseClient } from './optimized-client'

export const supabase = createOptimizedClient()
export type { OptimizedSupabaseClient }
