'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { statsAnalysisService } from '@/lib/services/stats-analysis'
import { StatsSummary, StatsAnalysis, PlayerStats, GameStats } from '@/types/game-stats'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { logger } from '@/lib/utils/logger'
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap,
  Award,
  BarChart3,
  Calendar,
  Users,
  Flame
} from 'lucide-react'

export default function StatsPage() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null)
  const [analysis, setAnalysis] = useState<StatsAnalysis | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'cards' | 'teams' | 'analysis'>('overview')

  useEffect(() => {
    const loadStats = async () => {
      if (!user) return

      setLoading(true)
      try {
        const [summary, analysisResult] = await Promise.all([
          statsAnalysisService.getPlayerStats(user.id),
          statsAnalysisService.analyzePlayerPerformance(user.id)
        ])
        setStatsSummary(summary)
        setAnalysis(analysisResult)
      } catch (error) {
        logger.error('Failed to load stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载统计数据中...</p>
        </div>
      </div>
    )
  }

  if (!statsSummary || !analysis) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center">
          <p className="text-muted-foreground">暂无统计数据</p>
        </div>
      </div>
    )
  }

  const { player_stats, recent_games, card_play_stats, team_stats, trends } = statsSummary
  const { overall_performance, strengths, weaknesses, recommendations, comparison } = analysis

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">游戏统计</h1>
          <p className="text-muted-foreground">
            查看您的游戏表现和数据分析
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('overview')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            概览
          </Button>
          <Button
            variant={activeTab === 'games' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('games')}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            游戏记录
          </Button>
          <Button
            variant={activeTab === 'cards' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('cards')}
          >
            <Award className="mr-2 h-4 w-4" />
            牌型统计
          </Button>
          <Button
            variant={activeTab === 'teams' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('teams')}
          >
            <Users className="mr-2 h-4 w-4" />
            队友统计
          </Button>
          <Button
            variant={activeTab === 'analysis' ? 'primary' : 'outline'}
            onClick={() => setActiveTab('analysis')}
          >
            <Target className="mr-2 h-4 w-4" />
            性能分析
          </Button>
        </div>

        {activeTab === 'overview' && (
          <OverviewTab 
            playerStats={player_stats}
            overallPerformance={overall_performance}
            trends={trends}
          />
        )}

        {activeTab === 'games' && (
          <GamesTab games={recent_games} />
        )}

        {activeTab === 'cards' && (
          <CardsTab cardStats={card_play_stats} />
        )}

        {activeTab === 'teams' && (
          <TeamsTab teamStats={team_stats} />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab 
            strengths={strengths}
            weaknesses={weaknesses}
            recommendations={recommendations}
            comparison={comparison}
          />
        )}
      </div>
    </div>
  )
}

function OverviewTab({ playerStats, overallPerformance, trends }: {
  playerStats: PlayerStats
  overallPerformance: StatsAnalysis['overall_performance']
  trends: StatsSummary['trends']
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="总场次"
          value={playerStats.total_games}
          icon={<Trophy className="h-5 w-5" />}
          color="blue"
        />
        <StatCard
          title="胜率"
          value={`${playerStats.win_rate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          title="平均得分"
          value={playerStats.average_score.toFixed(1)}
          icon={<Target className="h-5 w-5" />}
          color="purple"
        />
        <StatCard
          title="排名"
          value={`#${overallPerformance.rank}`}
          icon={<Award className="h-5 w-5" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="平均时长"
          value={`${Math.floor(playerStats.average_duration / 60)}分钟`}
          icon={<Clock className="h-5 w-5" />}
          color="cyan"
        />
        <StatCard
          title="最长连胜"
          value={playerStats.longest_win_streak}
          icon={<Flame className="h-5 w-5" />}
          color="red"
        />
        <StatCard
          title="炸弹使用"
          value={playerStats.total_bombs_used}
          icon={<Zap className="h-5 w-5" />}
          color="orange"
        />
        <StatCard
          title="火箭使用"
          value={playerStats.total_rockets_used}
          icon={<Award className="h-5 w-5" />}
          color="pink"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>趋势分析</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">胜率趋势</h4>
              <div className="h-32 flex items-end gap-1">
                {trends.win_rate_trend.map((rate, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${rate}%` }}
                    title={`${rate.toFixed(1)}%`}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">得分趋势</h4>
              <div className="h-32 flex items-end gap-1">
                {trends.score_trend.map((score, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${Math.min(score, 200) / 2}px` }}
                    title={`${score.toFixed(1)}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">时长趋势</h4>
              <div className="h-32 flex items-end gap-1">
                {trends.duration_trend.map((duration, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-purple-500 rounded-t"
                    style={{ height: `${Math.min(duration, 900) / 9}px` }}
                    title={`${Math.floor(duration / 60)}分钟`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function GamesTab({ games }: { games: GameStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近游戏记录</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {games.map((game, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  game.result === 'win' ? 'bg-green-500' : 
                  game.result === 'lose' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
                <div>
                  <div className="font-semibold">
                    {game.result === 'win' ? '胜利' : game.result === 'lose' ? '失败' : '平局'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {game.game_type === 'ranked' ? '排位赛' : game.game_type === 'casual' ? '休闲赛' : '练习赛'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {game.team_score} - {game.opponent_score}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.floor(game.duration / 60)}分钟
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CardsTab({ cardStats }: { cardStats: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>牌型使用统计</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {cardStats.slice(0, 20).map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">
                  {stat.card_rank}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {stat.card_suit === 'hearts' ? '♥' : 
                     stat.card_suit === 'diamonds' ? '♦' : 
                     stat.card_suit === 'clubs' ? '♣' : '♠'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    使用 {stat.play_count} 次
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-500">
                  {stat.win_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  胜率
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TeamsTab({ teamStats }: { teamStats: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>队友配合统计</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-2">
          {teamStats.map((stat, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  {stat.team_mate_id?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold">
                    队友 #{i + 1}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.total_games} 场比赛
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-500">
                  {stat.win_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  胜率
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AnalysisTab({ strengths, weaknesses, recommendations, comparison }: {
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  comparison: StatsAnalysis['comparison']
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-green-500">优势</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {strengths.map((strength, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">待提升</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="space-y-2">
              {weaknesses.map((weakness, i) => (
                <li key={i} className="flex items-start gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>改进建议</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ul className="space-y-2">
            {recommendations.map((recommendation, i) => (
              <li key={i} className="flex items-start gap-2">
                <Target className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>对比分析</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">与平均水平对比</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>胜率</span>
                  <span className={comparison.vs_average.win_rate >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_average.win_rate >= 0 ? '+' : ''}{comparison.vs_average.win_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>得分</span>
                  <span className={comparison.vs_average.score >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_average.score >= 0 ? '+' : ''}{comparison.vs_average.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>时长</span>
                  <span className={comparison.vs_average.duration >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_average.duration >= 0 ? '+' : ''}{comparison.vs_average.duration.toFixed(0)}秒
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">与顶尖玩家对比</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>胜率</span>
                  <span className={comparison.vs_top_players.win_rate >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_top_players.win_rate >= 0 ? '+' : ''}{comparison.vs_top_players.win_rate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>得分</span>
                  <span className={comparison.vs_top_players.score >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_top_players.score >= 0 ? '+' : ''}{comparison.vs_top_players.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>时长</span>
                  <span className={comparison.vs_top_players.duration >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {comparison.vs_top_players.duration >= 0 ? '+' : ''}{comparison.vs_top_players.duration.toFixed(0)}秒
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ title, value, icon, color }: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'cyan' | 'red' | 'orange' | 'pink'
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    cyan: 'bg-cyan-500',
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colorClasses[color]} text-white`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
