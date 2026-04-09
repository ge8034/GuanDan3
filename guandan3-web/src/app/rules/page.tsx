/**
 * Rules 游戏规则页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { ArrowLeft, Book, Star, Shield, Zap } from 'lucide-react'
import { cn } from '@/design-system/utils/cn'

type RuleSection = 'basic' | 'cardTypes' | 'tribute' | 'strategy' | 'advanced'

export default function RulesPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<RuleSection>('basic')
  const { theme } = useTheme()

  const sections = [
    { id: 'basic' as RuleSection, title: '基本规则', icon: Book },
    { id: 'cardTypes' as RuleSection, title: '牌型说明', icon: Star },
    { id: 'tribute' as RuleSection, title: '进贡还贡', icon: Shield },
    { id: 'strategy' as RuleSection, title: '策略技巧', icon: Zap },
    { id: 'advanced' as RuleSection, title: '高级规则', icon: Zap }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">游戏概述</h3>
              <p className="text-neutral-700 leading-relaxed mb-4">
                掼蛋是一种流行于江苏、安徽等地的扑克牌游戏，由4人参与，分为两队对抗。
                每队两人，对家为队友，共同协作争取胜利。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">游戏人数</h4>
                  <p className="text-blue-700">4人（两队对抗）</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-2">使用牌数</h4>
                  <p className="text-green-700">两副扑克牌（108张）</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">获胜条件</h4>
                  <p className="text-purple-700">先出完牌的队伍获胜</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-orange-800 mb-2">升级机制</h4>
                  <p className="text-orange-700">获胜方升级，失败方进贡</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">发牌规则</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-blue-500">•</span>
                  <span>每人发27张牌，没有剩余底牌</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-blue-500">•</span>
                  <span>庄家（第一个出牌的人）由上一局获胜方担任</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-blue-500">•</span>
                  <span>首局随机确定庄家</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">出牌规则</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>庄家首先出牌，然后按逆时针顺序轮流出牌</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>后出牌者必须出与上家相同类型的牌，且牌面要更大</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>如果无法或不愿出牌，可以选择"过牌"</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>当连续3人过牌后，最后出牌的人获得新一轮出牌权</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>炸弹可以压过任何非炸弹牌型</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>王炸（四王）是最大的牌型，可以压过任何牌</span>
                </li>
                <li className="flex items-start gap-2 text-neutral-700">
                  <span className="text-success-600">•</span>
                  <span>双王、三王不是炸弹</span>
                </li>
              </ul>
            </Card>
          </div>
        )

      case 'cardTypes':
        return (
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">基本牌型</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800 mb-2">单张</h4>
                  <p className="text-neutral-700">任意一张牌</p>
                </div>
                <div className="border-l-4 border-success-500 pl-4">
                  <h4 className="font-semibold text-success-800 mb-2">对子</h4>
                  <p className="text-neutral-700">两张点数相同的牌</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800 mb-2">三张</h4>
                  <p className="text-neutral-700">三张点数相同的牌</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-800 mb-2">三带二</h4>
                  <p className="text-neutral-700">三张相同点数 + 两张对子（两张任意牌必须是对子）</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">顺子牌型</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-cyan-500 pl-4">
                  <h4 className="font-semibold text-cyan-800 mb-2">顺子</h4>
                  <p className="text-neutral-700">五张或更多连续点数的单张（至少5张）</p>
                  <p className="text-sm text-neutral-600 mt-1">例如：3-4-5-6-7</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold text-pink-800 mb-2">连对</h4>
                  <p className="text-neutral-700">三对或更多连续点数的对子（至少3对）</p>
                  <p className="text-sm text-neutral-600 mt-1">例如：33-44-55</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-indigo-800 mb-2">连三</h4>
                  <p className="text-neutral-700">两个或更多连续点数的三张（至少2个）</p>
                  <p className="text-sm text-neutral-600 mt-1">例如：333-444</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">特殊牌型</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-error-500 pl-4">
                  <h4 className="font-semibold text-error-800 mb-2">炸弹</h4>
                  <p className="text-neutral-700">四张或更多相同点数的牌</p>
                  <p className="text-sm text-neutral-600 mt-1">例如：4444、55555</p>
                  <p className="text-sm text-neutral-600 mt-1">炸弹可以压过任何非炸弹牌型</p>
                </div>
                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold text-amber-800 mb-2">王炸</h4>
                  <p className="text-neutral-700">四张王（两张大王 + 两张小王）</p>
                  <p className="text-sm text-neutral-600 mt-1">王炸是最大的牌型，可以压过任何牌</p>
                  <p className="text-sm text-neutral-600 mt-1">注意：双王、三王不是炸弹</p>
                </div>
                <div className="border-l-4 border-teal-500 pl-4">
                  <h4 className="font-semibold text-teal-800 mb-2">逢人配</h4>
                  <p className="text-neutral-700">红桃级牌可以作为任意牌使用</p>
                  <p className="text-sm text-neutral-600 mt-1">例如：级牌是2，红桃2可以代替任意牌组成牌型</p>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'tribute':
        return (
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">进贡规则</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-red-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-error-800 mb-2">进贡条件</h4>
                  <ul className="space-y-1 text-error-900">
                    <li>• 失败方需要向获胜方进贡</li>
                    <li>• 每人进贡一张最大的牌（且必须&gt;=10）</li>
                    <li>• 有王必须进贡，但不能进逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡，不向三游进贡</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-success-800 mb-2">抗贡条件</h4>
                  <ul className="space-y-1 text-success-900">
                    <li>• 需要持有双大王（两张红大王）才能抗贡</li>
                    <li>• 如果失败方有一人持有双大王，两人都无需进贡</li>
                    <li>• 抗贡后不需要进贡和还贡</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">还贡规则</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">还贡方式</h4>
                  <ul className="space-y-1 text-blue-900">
                    <li>• 获胜方收到进贡牌后，需要还贡一张牌</li>
                    <li>• 还贡一张小于10的牌</li>
                    <li>• 还贡牌不能是进贡牌</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">进贡还贡流程</h4>
                  <ol className="space-y-1 text-purple-900">
                    <li>1. 失败方每人选择一张最大的牌进贡</li>
                    <li>2. 获胜方每人收到一张进贡牌</li>
                    <li>3. 获胜方每人还贡一张小于10的牌</li>
                    <li>4. 失败方每人收到一张还贡牌</li>
                    <li>5. 进贡还贡完成后开始新游戏</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'strategy':
        return (
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">基本策略</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-800 mb-2">记牌技巧</h4>
                  <ul className="space-y-2 text-neutral-700">
                    <li>• 记住已经出过的牌，特别是大牌和炸弹</li>
                    <li>• 关注对手和队友的出牌，推断他们的手牌</li>
                    <li>• 注意哪些牌型已经出完，避免被压制</li>
                  </ul>
                </div>
                <div className="border-l-4 border-success-500 pl-4">
                  <h4 className="font-semibold text-success-800 mb-2">出牌时机</h4>
                  <ul className="space-y-2 text-neutral-700">
                    <li>• 手牌少时（&lt;=5张）要谨慎，避免被压制</li>
                    <li>• 手牌多时可以主动出牌，控制节奏</li>
                    <li>• 对手手牌少时，尽量出大牌压制</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-800 mb-2">炸弹使用</h4>
                  <ul className="space-y-2 text-neutral-700">
                    <li>• 炸弹是宝贵的资源，不要轻易使用</li>
                    <li>• 在关键时刻使用炸弹，如对手即将出完牌时</li>
                    <li>• 炸弹可以用来获得出牌权，控制游戏节奏</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">团队协作</h3>
              <div className="flex flex-col gap-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-800 mb-2">配合队友</h4>
                  <ul className="space-y-2 text-neutral-700">
                    <li>• 队友出大牌时，通常选择过牌</li>
                    <li>• 队友出小牌时，可以适当压制帮助</li>
                    <li>• 队友手牌少时，尽量让队友控制</li>
                    <li>• 不要炸队友，除非必要</li>
                  </ul>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold text-pink-800 mb-2">压制对手</h4>
                  <ul className="space-y-2 text-neutral-700">
                    <li>• 对手手牌少时，优先压制</li>
                    <li>• 对手出小牌时，用大牌压制</li>
                    <li>• 对手即将出完牌时，用炸弹阻止</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'advanced':
        return (
          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">抗贡规则详解</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-red-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-error-800 mb-2">抗贡条件</h4>
                  <ul className="space-y-1 text-error-900">
                    <li>• 必须拥有双大王（两张红王）才能抗贡</li>
                    <li>• 抗贡是失败方的权利，可以选择是否使用</li>
                    <li>• 抗贡后不需要进贡，直接开始新游戏</li>
                  </ul>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-orange-800 mb-2">抗贡策略分析</h4>
                  <ul className="space-y-1 text-orange-900">
                    <li>• <strong>必须抗贡</strong>：只有双红大王，没有其他牌</li>
                    <li>• <strong>必须抗贡</strong>：所有非王牌都是级牌</li>
                    <li>• <strong>建议抗贡</strong>：最大进贡牌为A或更大</li>
                    <li>• <strong>可以抗贡</strong>：有2张以上大牌（Q及以上）</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">进贡还贡策略</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-800 mb-2">进贡策略</h4>
                  <ul className="space-y-1 text-blue-900">
                    <li>• 进贡最大的牌（必须&gt;=10）</li>
                    <li>• 不能进贡王或逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡</li>
                    <li>• 花色优先级：黑桃 &gt; 红桃 &gt; 梅花 &gt; 方块</li>
                  </ul>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-success-800 mb-2">还贡策略</h4>
                  <ul className="space-y-1 text-success-900">
                    <li>• 还贡一张小于10的牌</li>
                    <li>• 花色优先级：方块 &gt; 梅花 &gt; 红桃 &gt; 黑桃</li>
                  </ul>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-purple-800 mb-2">进贡还贡优势分析</h4>
                  <ul className="space-y-1 text-purple-900">
                    <li>• <strong>还贡方大优</strong>：还贡牌比进贡牌大5点以上</li>
                    <li>• <strong>还贡方小优</strong>：还贡牌比进贡牌大2-5点</li>
                    <li>• <strong>双方平衡</strong>：还贡牌与进贡牌差距在2点以内</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen p-4 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* 返回按钮和标题 */}
          <div className="mb-8">
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-5 h-5" />}
              className="mb-4"
            >
              返回首页
            </Button>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              游戏规则
            </h1>
            <p className="text-lg text-neutral-600">
              了解掼蛋的规则和策略，提升你的游戏技巧
            </p>
          </div>

          {/* 主体内容 */}
          <div className="grid grid-cols-4 gap-6">
            {/* 侧边导航 */}
            <div className="col-span-1">
              <Card className="sticky top-6 p-4">
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  规则目录
                </h2>
                <nav className="flex flex-col gap-2">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg border-none',
                          'flex items-center gap-3 text-sm font-medium',
                          'transition-all duration-200',
                          'cursor-pointer',
                          activeSection === section.id
                            ? 'bg-poker-table-700 text-white'
                            : 'bg-transparent text-neutral-700 hover:bg-black/5'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{section.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </Card>
            </div>

            {/* 内容区域 */}
            <div className="col-span-3">
              <Card className="p-6">
                {renderContent()}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
