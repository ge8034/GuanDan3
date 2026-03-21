import { supabase } from '@/lib/supabase/optimized-client'

export interface IndexDefinition {
  table: string
  columns: string[]
  unique?: boolean
  name?: string
  where?: string
}

export interface IndexAnalysisResult {
  table: string
  currentIndexes: string[]
  recommendedIndexes: IndexDefinition[]
  performanceImpact: 'high' | 'medium' | 'low'
}

export class DatabaseIndexOptimizer {
  private static instance: DatabaseIndexOptimizer
  private analysisResults: Map<string, IndexAnalysisResult> = new Map()

  private constructor() {}

  static getInstance(): DatabaseIndexOptimizer {
    if (!DatabaseIndexOptimizer.instance) {
      DatabaseIndexOptimizer.instance = new DatabaseIndexOptimizer()
    }
    return DatabaseIndexOptimizer.instance
  }

  async analyzeTable(tableName: string): Promise<IndexAnalysisResult> {
    try {
      const { data: indexes, error } = await supabase.rpc('get_table_indexes', {
        table_name: tableName
      })

      if (error) {
        console.error(`Failed to analyze indexes for table ${tableName}:`, error)
        const recommendedIndexes = this.getRecommendedIndexes(tableName, [])
        return {
          table: tableName,
          currentIndexes: [],
          recommendedIndexes,
          performanceImpact: this.calculatePerformanceImpact(recommendedIndexes)
        }
      }

      const currentIndexes = indexes?.map((idx: any) => idx.indexname) || []
      const recommendedIndexes = this.getRecommendedIndexes(tableName, currentIndexes)

      const result: IndexAnalysisResult = {
        table: tableName,
        currentIndexes,
        recommendedIndexes,
        performanceImpact: this.calculatePerformanceImpact(recommendedIndexes)
      }

      this.analysisResults.set(tableName, result)
      return result
    } catch (error) {
      console.error(`Error analyzing table ${tableName}:`, error)
      const recommendedIndexes = this.getRecommendedIndexes(tableName, [])
      return {
        table: tableName,
        currentIndexes: [],
        recommendedIndexes,
        performanceImpact: this.calculatePerformanceImpact(recommendedIndexes)
      }
    }
  }

  async analyzeAllTables(): Promise<IndexAnalysisResult[]> {
    const tables = [
      'users',
      'rooms',
      'games',
      'game_players',
      'game_actions',
      'friends',
      'friend_requests',
      'messages'
    ]

    const results = await Promise.all(
      tables.map(table => this.analyzeTable(table))
    )

    return results
  }

  async createIndex(indexDef: IndexDefinition): Promise<boolean> {
    try {
      const indexName = indexDef.name || `idx_${indexDef.table}_${indexDef.columns.join('_')}`

      const { error } = await supabase.rpc('create_index', {
        index_name: indexName,
        table_name: indexDef.table,
        columns: indexDef.columns,
        unique: indexDef.unique || false,
        where_clause: indexDef.where
      })

      if (error) {
        console.error(`Failed to create index ${indexName}:`, error)
        return false
      }

      console.log(`Successfully created index: ${indexName}`)
      return true
    } catch (error) {
      console.error(`Error creating index:`, error)
      return false
    }
  }

  async createRecommendedIndexes(tableName: string): Promise<number> {
    const analysis = await this.analyzeTable(tableName)
    let createdCount = 0

    for (const indexDef of analysis.recommendedIndexes) {
      const success = await this.createIndex(indexDef)
      if (success) {
        createdCount++
      }
    }

    return createdCount
  }

  async createAllRecommendedIndexes(): Promise<number> {
    const analyses = await this.analyzeAllTables()
    let totalCreated = 0

    for (const analysis of analyses) {
      const created = await this.createRecommendedIndexes(analysis.table)
      totalCreated += created
    }

    return totalCreated
  }

  async dropIndex(tableName: string, indexName: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('drop_index', {
        index_name: indexName
      })

      if (error) {
        console.error(`Failed to drop index ${indexName}:`, error)
        return false
      }

      console.log(`Successfully dropped index: ${indexName}`)
      return true
    } catch (error) {
      console.error(`Error dropping index:`, error)
      return false
    }
  }

  getAnalysisResult(tableName: string): IndexAnalysisResult | undefined {
    return this.analysisResults.get(tableName)
  }

  getAllAnalysisResults(): IndexAnalysisResult[] {
    return Array.from(this.analysisResults.values())
  }

  private getRecommendedIndexes(tableName: string, existingIndexes: string[]): IndexDefinition[] {
    const recommendations: IndexDefinition[] = []

    switch (tableName) {
      case 'users':
        recommendations.push(
          { table: 'users', columns: ['username'], unique: true },
          { table: 'users', columns: ['email'], unique: true },
          { table: 'users', columns: ['created_at'] },
          { table: 'users', columns: ['last_active'] }
        )
        break

      case 'rooms':
        recommendations.push(
          { table: 'rooms', columns: ['status'] },
          { table: 'rooms', columns: ['created_at'] },
          { table: 'rooms', columns: ['host_id'] },
          { table: 'rooms', columns: ['status', 'created_at'] }
        )
        break

      case 'games':
        recommendations.push(
          { table: 'games', columns: ['room_id'] },
          { table: 'games', columns: ['status'] },
          { table: 'games', columns: ['created_at'] },
          { table: 'games', columns: ['room_id', 'status'] }
        )
        break

      case 'game_players':
        recommendations.push(
          { table: 'game_players', columns: ['game_id'] },
          { table: 'game_players', columns: ['user_id'] },
          { table: 'game_players', columns: ['game_id', 'user_id'], unique: true },
          { table: 'game_players', columns: ['team'] }
        )
        break

      case 'game_actions':
        recommendations.push(
          { table: 'game_actions', columns: ['game_id'] },
          { table: 'game_actions', columns: ['player_id'] },
          { table: 'game_actions', columns: ['action_type'] },
          { table: 'game_actions', columns: ['game_id', 'created_at'] }
        )
        break

      case 'friends':
        recommendations.push(
          { table: 'friends', columns: ['user_id'] },
          { table: 'friends', columns: ['friend_id'] },
          { table: 'friends', columns: ['user_id', 'friend_id'], unique: true },
          { table: 'friends', columns: ['status'] }
        )
        break

      case 'friend_requests':
        recommendations.push(
          { table: 'friend_requests', columns: ['from_user_id'] },
          { table: 'friend_requests', columns: ['to_user_id'] },
          { table: 'friend_requests', columns: ['status'] },
          { table: 'friend_requests', columns: ['created_at'] }
        )
        break

      case 'messages':
        recommendations.push(
          { table: 'messages', columns: ['room_id'] },
          { table: 'messages', columns: ['sender_id'] },
          { table: 'messages', columns: ['created_at'] },
          { table: 'messages', columns: ['room_id', 'created_at'] }
        )
        break
    }

    return recommendations.filter(
      rec => !existingIndexes.includes(rec.name || `idx_${rec.table}_${rec.columns.join('_')}`)
    )
  }

  private calculatePerformanceImpact(indexes: IndexDefinition[]): 'high' | 'medium' | 'low' {
    if (indexes.length === 0) return 'low'
    if (indexes.length <= 2) return 'low'
    if (indexes.length <= 4) return 'medium'
    return 'high'
  }

  async getIndexUsageStats(): Promise<Map<string, number>> {
    const stats = new Map<string, number>()

    try {
      const { data, error } = await supabase.rpc('get_index_usage_stats')

      if (error) {
        console.error('Failed to get index usage stats:', error)
        return stats
      }

      data?.forEach((row: any) => {
        stats.set(row.index_name, row.usage_count)
      })
    } catch (error) {
      console.error('Error getting index usage stats:', error)
    }

    return stats
  }

  async optimizeIndexes(): Promise<{
    created: number
    dropped: number
    errors: string[]
  }> {
    const results = {
      created: 0,
      dropped: 0,
      errors: [] as string[]
    }

    try {
      const usageStats = await this.getIndexUsageStats()
      const analyses = await this.analyzeAllTables()

      for (const analysis of analyses) {
        for (const indexDef of analysis.recommendedIndexes) {
          const indexName = indexDef.name || `idx_${indexDef.table}_${indexDef.columns.join('_')}`
          const usage = usageStats.get(indexName) || 0

          if (usage === 0) {
            const dropped = await this.dropIndex(analysis.table, indexName)
            if (dropped) {
              results.dropped++
            }
          } else {
            const created = await this.createIndex(indexDef)
            if (created) {
              results.created++
            }
          }
        }
      }
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : String(error))
    }

    return results
  }
}

export const databaseIndexOptimizer = DatabaseIndexOptimizer.getInstance()
