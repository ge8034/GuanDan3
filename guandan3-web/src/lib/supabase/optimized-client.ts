import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'
import { databaseOptimizer, DatabaseMetrics } from '../performance/database-optimizer'
import { networkOptimizer, NetworkMetrics } from '../performance/network-optimizer'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

let baseClient: SupabaseClient | null = null

function getBaseClient(): SupabaseClient {
  if (!baseClient) {
    baseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey)
  }
  return baseClient
}

interface OptimizedSupabaseClient {
  from: (table: string) => any
  rpc: (fn: string, params?: any, options?: { count?: 'exact' | 'planned' | 'estimated' }) => any
  channel: (name: string, config?: any) => any
  removeChannel: (channel: any) => void
  auth: any
  getDatabaseMetrics: () => DatabaseMetrics
  getDatabasePerformanceReport: () => ReturnType<typeof import('../performance/database-optimizer').getDatabasePerformanceReport>
  clearDatabaseCache: (pattern?: string) => void
  exportDatabaseMetrics: () => string
  getNetworkMetrics: () => NetworkMetrics
  getNetworkPerformanceReport: () => {
    metrics: NetworkMetrics
    slowRequests: ReturnType<typeof networkOptimizer.getSlowRequests>
    failedRequests: ReturnType<typeof networkOptimizer.getFailedRequests>
  }
  clearNetworkMetrics: () => void
}

function createOptimizedClient(): OptimizedSupabaseClient {
  const client: OptimizedSupabaseClient = {
    from: (table: string) => {
      const queryBuilder = getBaseClient().from(table)

      const originalSelect = queryBuilder.select.bind(queryBuilder)
      const originalInsert = queryBuilder.insert.bind(queryBuilder)
      const originalUpdate = queryBuilder.update.bind(queryBuilder)
      const originalDelete = queryBuilder.delete.bind(queryBuilder)

      queryBuilder.select = function(columns?: string, options?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }) {
        const query = `SELECT ${columns || '*'} FROM ${table}`
        const cacheKey = options?.head ? `${query}:head` : query

        const startTime = performance.now()
        const timestamp = Date.now()

        const cached = databaseOptimizer.getCache(cacheKey)
        if (cached !== null) {
          databaseOptimizer.recordQuery({
            query,
            duration: performance.now() - startTime,
            success: true,
            timestamp,
            cached: true
          })
          return cached
        }

        const result = originalSelect(columns, options)

        Promise.resolve(result).then((data: any) => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: true,
            timestamp,
            cached: false
          })
          databaseOptimizer.setCache(cacheKey, data, 60000)
        }).catch((error: any) => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: false,
            timestamp,
            cached: false,
            error: error?.message
          })
        })

        return result
      }

      queryBuilder.insert = function(values: any, options?: { count?: 'exact' | 'planned' | 'estimated' }) {
        const query = `INSERT INTO ${table}`
        const startTime = performance.now()
        const timestamp = Date.now()

        const result = originalInsert(values, options)

        Promise.resolve(result).then(() => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: true,
            timestamp,
            cached: false
          })
        }).catch((error: any) => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: false,
            timestamp,
            cached: false,
            error: error?.message
          })
        })

        return result
      }

      queryBuilder.update = function(values: any) {
        const query = `UPDATE ${table}`
        const startTime = performance.now()
        const timestamp = Date.now()

        const result = originalUpdate(values)

        Promise.resolve(result).then(() => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: true,
            timestamp,
            cached: false
          })
        }).catch((error: any) => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: false,
            timestamp,
            cached: false,
            error: error?.message
          })
        })

        return result
      }

      queryBuilder.delete = function() {
        const query = `DELETE FROM ${table}`
        const startTime = performance.now()
        const timestamp = Date.now()

        const result = originalDelete()

        Promise.resolve(result).then(() => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: true,
            timestamp,
            cached: false
          })
        }).catch((error: any) => {
          const duration = performance.now() - startTime
          databaseOptimizer.recordQuery({
            query,
            duration,
            success: false,
            timestamp,
            cached: false,
            error: error?.message
          })
        })

        return result
      }

      return queryBuilder
    },

    rpc: (fn: string, params?: any, options?: { count?: 'exact' | 'planned' | 'estimated' }) => {
      const query = `RPC ${fn}`
      const cacheKey = `rpc:${fn}`
      const startTime = performance.now()
      const timestamp = Date.now()

      const cached = databaseOptimizer.getCache(cacheKey)
      if (cached !== null) {
        databaseOptimizer.recordQuery({
          query,
          duration: performance.now() - startTime,
          success: true,
          timestamp,
          cached: true
        })
        return cached
      }

      const result = getBaseClient().rpc(fn, params, options)

      Promise.resolve(result).then((data: any) => {
        const duration = performance.now() - startTime
        databaseOptimizer.recordQuery({
          query,
          duration,
          success: true,
          timestamp,
          cached: false
        })
        databaseOptimizer.setCache(cacheKey, data, 30000)
      }).catch((error: any) => {
        const duration = performance.now() - startTime
        databaseOptimizer.recordQuery({
          query,
          duration,
          success: false,
          timestamp,
          cached: false,
          error: error?.message
        })
      })

      return result
    },

    channel: (name: string, config?: any) => {
      return getBaseClient().channel(name, config)
    },

    removeChannel: (channel: any) => {
      getBaseClient().removeChannel(channel)
    },

    auth: getBaseClient().auth,

    getDatabaseMetrics: () => databaseOptimizer.getMetrics(),

    getDatabasePerformanceReport: () => {
      const { getDatabasePerformanceReport } = require('../performance/database-optimizer')
      return getDatabasePerformanceReport()
    },

    clearDatabaseCache: (pattern?: string) => databaseOptimizer.clearCache(pattern),

    exportDatabaseMetrics: () => databaseOptimizer.exportMetrics(),

    getNetworkMetrics: () => networkOptimizer.getMetrics(),

    getNetworkPerformanceReport: () => {
      return {
        metrics: networkOptimizer.getMetrics(),
        slowRequests: networkOptimizer.getSlowRequests(),
        failedRequests: networkOptimizer.getFailedRequests()
      }
    },

    clearNetworkMetrics: () => networkOptimizer.clearMetrics()
  }

  return client
}

export const supabase = createOptimizedClient()
export { createOptimizedClient }
export type { OptimizedSupabaseClient }
