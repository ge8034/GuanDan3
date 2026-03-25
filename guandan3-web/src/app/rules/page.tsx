'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import FadeIn from '@/components/ui/FadeIn'
import { CloudMountainBackground } from '@/components/backgrounds/CloudMountainBackground.lazy'
import { ArrowLeftIcon, BookIcon, StarIcon, ShieldIcon, ZapIcon } from '@/components/icons/LandscapeIcons'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useTheme } from '@/lib/theme/theme-context'

type RuleSection = 'basic' | 'cardTypes' | 'tribute' | 'strategy' | 'advanced'

export default function RulesPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<RuleSection>('basic')
  const { currentTheme } = useTheme()

  const sections = [
    { id: 'basic' as RuleSection, title: '基本规则', icon: BookIcon },
    { id: 'cardTypes' as RuleSection, title: '牌型说明', icon: StarIcon },
    { id: 'tribute' as RuleSection, title: '进贡还贡', icon: ShieldIcon },
    { id: 'strategy' as RuleSection, title: '策略技巧', icon: ZapIcon },
    { id: 'advanced' as RuleSection, title: '高级规则', icon: ZapIcon }
  ]

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">游戏概述</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                掼蛋是一种流行于江苏、安徽等地的扑克牌游戏，由4人参与，分为两队对抗。
                每队两人，对家为队友，共同协作争取胜利。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">游戏人数</h4>
                  <p className="text-blue-800 dark:text-blue-200">4人（两队对抗）</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">使用牌数</h4>
                  <p className="text-green-800 dark:text-green-200">两副扑克牌（108张）</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">获胜条件</h4>
                  <p className="text-purple-800 dark:text-purple-200">先出完牌的队伍获胜</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">升级机制</h4>
                  <p className="text-orange-800 dark:text-orange-200">获胜方升级，失败方进贡</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">发牌规则</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>每人发27张牌，没有剩余底牌</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>庄家（第一个出牌的人）由上一局获胜方担任</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>首局随机确定庄家</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">出牌规则</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>庄家首先出牌，然后按逆时针顺序轮流出牌</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>后出牌者必须出与上家相同类型的牌，且牌面要更大</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>如果无法或不愿出牌，可以选择&ldquo;过牌&rdquo;</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>当连续3人过牌后，最后出牌的人获得新一轮出牌权</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>炸弹可以压过任何非炸弹牌型</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>王炸（四王）是最大的牌型，可以压过任何牌</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span>双王、三王不是炸弹</span>
                </li>
              </ul>
            </div>
          </div>
        )

      case 'cardTypes':
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">基本牌型</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">单张</h4>
                  <p className="text-gray-700 dark:text-gray-300">任意一张牌</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">对子</h4>
                  <p className="text-gray-700 dark:text-gray-300">两张点数相同的牌</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">三张</h4>
                  <p className="text-gray-700 dark:text-gray-300">三张点数相同的牌</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">三带二</h4>
                  <p className="text-gray-700 dark:text-gray-300">三张相同点数 + 两张任意牌（对子或单张）</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">顺子牌型</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-cyan-500 pl-4">
                  <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">顺子</h4>
                  <p className="text-gray-700 dark:text-gray-300">五张或更多连续点数的单张（至少5张）</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：3-4-5-6-7</p>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">连对</h4>
                  <p className="text-gray-700 dark:text-gray-300">三对或更多连续点数的对子（至少3对）</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：33-44-55</p>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">连三</h4>
                  <p className="text-gray-700 dark:text-gray-300">两个或更多连续点数的三张（至少2个）</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：333-444</p>
                </div>
                <div className="border-l-4 border-rose-500 pl-4">
                  <h4 className="font-semibold text-rose-900 dark:text-rose-100 mb-2">连三带二</h4>
                  <p className="text-gray-700 dark:text-gray-300">连续的三张 + 相同数量的对子或单张</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：333-444 + 5-6</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">特殊牌型</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">炸弹</h4>
                  <p className="text-gray-700 dark:text-gray-300">四张或更多相同点数的牌</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：4444、55555</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">炸弹可以压过任何非炸弹牌型</p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">王炸</h4>
                  <p className="text-gray-700 dark:text-gray-300">四张王（两张大王 + 两张小王）</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">王炸是最大的牌型，可以压过任何牌</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">注意：双王、三王不是炸弹</p>
                </div>
                <div className="border-l-4 border-emerald-500 pl-4">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">逢人配</h4>
                  <p className="text-gray-700 dark:text-gray-300">红桃级牌可以作为任意牌使用</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">例如：级牌是2，红桃2可以代替任意牌组成牌型</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'tribute':
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">进贡规则</h3>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">进贡条件</h4>
                  <ul className="space-y-2 text-red-800 dark:text-red-200">
                    <li>• 失败方需要向获胜方进贡</li>
                    <li>• 每人进贡一张最大的牌（且必须≥10）</li>
                    <li>• 不能进贡王或逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡，不向三游进贡</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">抗贡条件</h4>
                  <ul className="space-y-2 text-green-800 dark:text-green-200">
                    <li>• 如果失败方手中有双大王，可以抗贡</li>
                    <li>• 抗贡后不需要进贡</li>
                    <li>• 抗贡是失败方的权利，可以选择是否使用</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">还贡规则</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">还贡方式</h4>
                  <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                    <li>• 获胜方收到进贡牌后，需要还贡一张牌</li>
                    <li>• 还贡一张最小的牌</li>
                    <li>• 还贡牌不能是进贡牌</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">进贡还贡流程</h4>
                  <ol className="space-y-2 text-purple-800 dark:text-purple-200 list-decimal list-inside">
                    <li>1. 失败方每人选择一张最大的牌进贡</li>
                    <li>2. 获胜方每人收到一张进贡牌</li>
                    <li>3. 获胜方每人还贡一张最小的牌</li>
                    <li>4. 失败方每人收到一张还贡牌</li>
                    <li>5. 进贡还贡完成后开始新游戏</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">特殊情况</h3>
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">双抗贡</h4>
                  <p className="text-orange-800 dark:text-orange-200">
                    如果失败方两人都有双王，两人都可以选择抗贡
                  </p>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">部分抗贡</h4>
                  <p className="text-cyan-800 dark:text-cyan-200">
                    如果失败方只有一人有双王，只有该人可以抗贡，另一人仍需进贡
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'strategy':
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">基本策略</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">记牌技巧</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 记住已经出过的牌，特别是大牌和炸弹</li>
                    <li>• 关注对手和队友的出牌，推断他们的手牌</li>
                    <li>• 注意哪些牌型已经出完，避免被压制</li>
                  </ul>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">出牌时机</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 手牌少时（≤5张）要谨慎，避免被压制</li>
                    <li>• 手牌多时可以主动出牌，控制节奏</li>
                    <li>• 对手手牌少时，尽量出大牌压制</li>
                  </ul>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">炸弹使用</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 炸弹是宝贵的资源，不要轻易使用</li>
                    <li>• 在关键时刻使用炸弹，如对手即将出完牌时</li>
                    <li>• 炸弹可以用来获得出牌权，控制游戏节奏</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">团队协作</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">配合队友</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 队友出大牌时，通常选择过牌</li>
                    <li>• 队友出小牌时，可以适当压制帮助</li>
                    <li>• 队友手牌少时，尽量让队友控制</li>
                    <li>• 不要炸队友，除非必要</li>
                  </ul>
                </div>
                <div className="border-l-4 border-pink-500 pl-4">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">压制对手</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 对手手牌少时，优先压制</li>
                    <li>• 对手出小牌时，用大牌压制</li>
                    <li>• 对手即将出完牌时，用炸弹阻止</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">高级技巧</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-cyan-500 pl-4">
                  <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">逢人配使用</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 红桃级牌可以灵活使用，组成各种牌型</li>
                    <li>• 可以用来补全顺子、连对等牌型</li>
                    <li>• 也可以用来组成炸弹，增加压制力</li>
                  </ul>
                </div>
                <div className="border-l-4 border-indigo-500 pl-4">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">心理战术</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• 观察对手的出牌习惯，预判他们的策略</li>
                    <li>• 适时过牌，保留实力</li>
                    <li>• 在关键时刻出其不意，打乱对手节奏</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">抗贡规则详解</h3>
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">抗贡条件</h4>
                  <ul className="space-y-2 text-red-800 dark:text-red-200">
                    <li>• 必须拥有双大王（两张红王）才能抗贡</li>
                    <li>• 抗贡是失败方的权利，可以选择是否使用</li>
                    <li>• 抗贡后不需要进贡，直接开始新游戏</li>
                  </ul>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">抗贡策略分析</h4>
                  <ul className="space-y-2 text-orange-800 dark:text-orange-200">
                    <li>• <strong>必须抗贡</strong>：只有双王，没有其他牌</li>
                    <li>• <strong>必须抗贡</strong>：所有非王牌都是级牌</li>
                    <li>• <strong>建议抗贡</strong>：最大进贡牌为A或更大</li>
                    <li>• <strong>建议抗贡</strong>：有3张以上大牌（10及以上）</li>
                    <li>• <strong>可以抗贡</strong>：有2张以上大牌（Q及以上）</li>
                    <li>• <strong>不建议抗贡</strong>：只有小牌，牌力不足</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">进贡还贡策略</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">进贡策略</h4>
                  <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                    <li>• 进贡最大的牌（必须≥10）</li>
                    <li>• 不能进贡王或逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡</li>
                    <li>• 如果有多个相同点数的牌，优先进贡花色较小的</li>
                    <li>• 花色优先级：黑桃 &gt; 红桃 &gt; 梅花 &gt; 方块</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">还贡策略</h4>
                  <ul className="space-y-2 text-green-800 dark:text-green-200">
                    <li>• 还贡最小的牌</li>
                    <li>• 还贡牌的点数应该接近进贡牌（差距不超过2点）</li>
                    <li>• 如果有多个相同点数的牌，优先还贡花色较大的</li>
                    <li>• 花色优先级：方块 &gt; 梅花 &gt; 红桃 &gt; 黑桃</li>
                  </ul>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">进贡还贡优势分析</h4>
                  <ul className="space-y-2 text-purple-800 dark:text-purple-200">
                    <li>• <strong>还贡方大优</strong>：还贡牌比进贡牌大5点以上</li>
                    <li>• <strong>还贡方小优</strong>：还贡牌比进贡牌大2-5点</li>
                    <li>• <strong>双方平衡</strong>：还贡牌与进贡牌差距在2点以内</li>
                    <li>• <strong>进贡方小优</strong>：进贡牌比还贡牌大2-5点</li>
                    <li>• <strong>进贡方大优</strong>：进贡牌比还贡牌大5点以上</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">特殊规则</h3>
              <div className="space-y-4">
                <div className="bg-cyan-50 dark:bg-cyan-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">双抗贡</h4>
                  <p className="text-cyan-800 dark:text-cyan-200">
                    如果失败方两人都有双王，两人都可以选择抗贡。抗贡是个人选择，可以一人抗贡一人进贡。
                  </p>
                </div>
                <div className="bg-pink-50 dark:bg-pink-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-pink-900 dark:text-pink-100 mb-2">进贡还贡配对</h4>
                  <p className="text-pink-800 dark:text-pink-200">
                    进贡还贡按照排名配对：头游配四游，二游配三游。这样可以确保进贡还贡的公平性。
                  </p>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">级牌规则</h4>
                  <p className="text-indigo-800 dark:text-indigo-200">
                    级牌是当前等级对应的牌。例如，当前等级是2，那么2就是级牌。红桃级牌可以作为逢人配使用，可以代替任意牌组成牌型。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <CloudMountainBackground>
      <ThemeSwitcher />
      <main className="min-h-screen p-6 md:p-12">
        <FadeIn>
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="mb-4"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                返回首页
              </Button>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                游戏规则
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                了解掼蛋的规则和策略，提升你的游戏技巧
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 shadow-lg sticky top-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    规则目录
                  </h2>
                  <nav className="space-y-2">
                    {sections.map((section) => {
                      const Icon = section.icon
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${
                            activeSection === section.id
                              ? 'bg-blue-500 text-white shadow-md'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                          <span className="font-medium">{section.title}</span>
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </main>
    </CloudMountainBackground>
  )
}