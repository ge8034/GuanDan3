'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { ArrowLeft, Book, Star, Shield, Zap } from 'lucide-react'

type RuleSection = 'basic' | 'cardTypes' | 'tribute' | 'strategy' | 'advanced'

interface SectionItem {
  id: RuleSection
  title: string
  icon: React.ComponentType<{ className?: string }>
}

const sections: SectionItem[] = [
  { id: 'basic', title: '基本规则', icon: Book },
  { id: 'cardTypes', title: '牌型说明', icon: Star },
  { id: 'tribute', title: '进贡还贡', icon: Shield },
  { id: 'strategy', title: '策略技巧', icon: Zap },
  { id: 'advanced', title: '高级规则', icon: Zap }
]

// 侧边导航按钮
function NavButton({
  active,
  icon: Icon,
  label,
  onClick
}: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg',
        'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        active
          ? 'bg-primary text-white font-medium'
          : 'bg-transparent text-neutral-700 hover:bg-neutral-100'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </button>
  )
}

// 信息卡片
function InfoCard({
  title,
  children,
  color = 'blue'
}: {
  title?: string
  children: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow' | 'pink' | 'indigo' | 'cyan'
}) {
  const colorStyles = {
    blue: 'bg-blue-50 border-l-blue-500 text-blue-900',
    green: 'bg-green-50 border-l-green-500 text-green-900',
    purple: 'bg-purple-50 border-l-purple-500 text-purple-900',
    orange: 'bg-orange-50 border-l-orange-500 text-orange-900',
    red: 'bg-red-50 border-l-red-500 text-red-900',
    yellow: 'bg-yellow-50 border-l-yellow-500 text-yellow-900',
    pink: 'bg-pink-50 border-l-pink-500 text-pink-900',
    indigo: 'bg-indigo-50 border-l-indigo-500 text-indigo-900',
    cyan: 'bg-cyan-50 border-l-cyan-500 text-cyan-900',
  }

  return (
    <div className={cn('p-4 rounded-lg border-l-4', colorStyles[color])}>
      {title && (
        <h4 className="font-semibold mb-2">{title}</h4>
      )}
      <div className="leading-relaxed">
        {children}
      </div>
    </div>
  )
}

// 列表项
function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-neutral-700 leading-relaxed">
      <span className="text-primary">•</span>
      <span>{children}</span>
    </li>
  )
}

export default function RulesPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<RuleSection>('basic')
  const { theme } = useTheme()

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div className="flex flex-col gap-6">
            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">游戏概述</h3>
              <p className="text-neutral-700 mb-4 leading-relaxed">
                掼蛋是一种流行于江苏、安徽等地的扑克牌游戏，由4人参与，分为两队对抗。
                每队两人，对家为队友，共同协作争取胜利。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <InfoCard color="blue" title="游戏人数">
                  <p className="text-blue-700">4人（两队对抗）</p>
                </InfoCard>
                <InfoCard color="green" title="使用牌数">
                  <p className="text-green-700">两副扑克牌（108张）</p>
                </InfoCard>
                <InfoCard color="purple" title="获胜条件">
                  <p className="text-purple-700">先出完牌的队伍获胜</p>
                </InfoCard>
                <InfoCard color="orange" title="升级机制">
                  <p className="text-orange-700">获胜方升级，失败方进贡</p>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">发牌规则</h3>
              <ul className="space-y-3">
                <ListItem>每人发27张牌，没有剩余底牌</ListItem>
                <ListItem>庄家（第一个出牌的人）由上一局获胜方担任</ListItem>
                <ListItem>首局随机确定庄家</ListItem>
              </ul>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">出牌规则</h3>
              <ul className="space-y-3">
                <ListItem>庄家首先出牌，然后按逆时针顺序轮流出牌</ListItem>
                <ListItem>后出牌者必须出与上家相同类型的牌，且牌面要更大</ListItem>
                <ListItem>如果无法或不愿出牌，可以选择"过牌"</ListItem>
                <ListItem>当连续3人过牌后，最后出牌的人获得新一轮出牌权</ListItem>
                <ListItem>炸弹可以压过任何非炸弹牌型</ListItem>
                <ListItem>王炸（四王）是最大的牌型，可以压过任何牌</ListItem>
                <ListItem>双王、三王不是炸弹</ListItem>
              </ul>
            </Card>
          </div>
        )

      case 'cardTypes':
        return (
          <div className="flex flex-col gap-6">
            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">基本牌型</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="blue" title="单张">
                  <p>任意一张牌</p>
                </InfoCard>
                <InfoCard color="green" title="对子">
                  <p>两张点数相同的牌</p>
                </InfoCard>
                <InfoCard color="purple" title="三张">
                  <p>三张点数相同的牌</p>
                </InfoCard>
                <InfoCard color="orange" title="三带二">
                  <p>三张相同点数 + 两张对子（两张任意牌必须是对子）</p>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">顺子牌型</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="cyan" title="顺子">
                  <p>五张或更多连续点数的单张（至少5张）</p>
                  <p className="text-sm text-neutral-500 mt-1">例如：3-4-5-6-7</p>
                </InfoCard>
                <InfoCard color="pink" title="连对">
                  <p>三对或更多连续点数的对子（至少3对）</p>
                  <p className="text-sm text-neutral-500 mt-1">例如：33-44-55</p>
                </InfoCard>
                <InfoCard color="indigo" title="连三">
                  <p>两个或更多连续点数的三张（至少2个）</p>
                  <p className="text-sm text-neutral-500 mt-1">例如：333-444</p>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">特殊牌型</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="red" title="炸弹">
                  <p>四张或更多相同点数的牌</p>
                  <p className="text-sm text-neutral-500 mt-1">例如：4444、55555</p>
                  <p className="text-sm text-neutral-500 mt-1">炸弹可以压过任何非炸弹牌型</p>
                </InfoCard>
                <InfoCard color="yellow" title="王炸">
                  <p>四张王（两张大王 + 两张小王）</p>
                  <p className="text-sm text-neutral-500 mt-1">王炸是最大的牌型，可以压过任何牌</p>
                  <p className="text-sm text-neutral-500 mt-1">注意：双王、三王不是炸弹</p>
                </InfoCard>
                <InfoCard color="green" title="逢人配">
                  <p>红桃级牌可以作为任意牌使用</p>
                  <p className="text-sm text-neutral-500 mt-1">例如：级牌是2，红桃2可以代替任意牌组成牌型</p>
                </InfoCard>
              </div>
            </Card>
          </div>
        )

      case 'tribute':
        return (
          <div className="flex flex-col gap-6">
            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">进贡规则</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="red" title="进贡条件">
                  <ul className="space-y-1 text-red-900">
                    <li className="flex items-start gap-2"><span>•</span><span>失败方需要向获胜方进贡</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>每人进贡一张最大的牌（且必须&gt;=10）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>有王必须进贡，但不能进逢人配（红桃级牌）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>级牌可以进贡（非红桃级牌）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>只向胜方头游、二游进贡，不向三游进贡</span></li>
                  </ul>
                </InfoCard>
                <InfoCard color="green" title="抗贡条件">
                  <ul className="space-y-1 text-green-900">
                    <li className="flex items-start gap-2"><span>•</span><span>需要持有双大王（两张红大王）才能抗贡</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>如果失败方有一人持有双大王，两人都无需进贡</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>抗贡后不需要进贡和还贡</span></li>
                  </ul>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">还贡规则</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="blue" title="还贡方式">
                  <ul className="space-y-1 text-blue-900">
                    <li className="flex items-start gap-2"><span>•</span><span>获胜方收到进贡牌后，需要还贡一张牌</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>还贡一张小于10的牌</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>还贡牌不能是进贡牌</span></li>
                  </ul>
                </InfoCard>
                <InfoCard color="purple" title="进贡还贡流程">
                  <ol className="space-y-1 text-purple-900">
                    <li>1. 失败方每人选择一张最大的牌进贡</li>
                    <li>2. 获胜方每人收到一张进贡牌</li>
                    <li>3. 获胜方每人还贡一张小于10的牌</li>
                    <li>4. 失败方每人收到一张还贡牌</li>
                    <li>5. 进贡还贡完成后开始新游戏</li>
                  </ol>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">抗贡规则</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="green">
                  <p className="text-green-700">
                    如果失败方有一人持有双大王，两人都无需进贡
                  </p>
                </InfoCard>
              </div>
            </Card>
          </div>
        )

      case 'strategy':
        return (
          <div className="flex flex-col gap-6">
            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">基本策略</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="blue" title="记牌技巧">
                  <ul className="space-y-1">
                    <ListItem>记住已经出过的牌，特别是大牌和炸弹</ListItem>
                    <ListItem>关注对手和队友的出牌，推断他们的手牌</ListItem>
                    <ListItem>注意哪些牌型已经出完，避免被压制</ListItem>
                  </ul>
                </InfoCard>
                <InfoCard color="green" title="出牌时机">
                  <ul className="space-y-1">
                    <ListItem>手牌少时（&lt;=5张）要谨慎，避免被压制</ListItem>
                    <ListItem>手牌多时可以主动出牌，控制节奏</ListItem>
                    <ListItem>对手手牌少时，尽量出大牌压制</ListItem>
                  </ul>
                </InfoCard>
                <InfoCard color="purple" title="炸弹使用">
                  <ul className="space-y-1">
                    <ListItem>炸弹是宝贵的资源，不要轻易使用</ListItem>
                    <ListItem>在关键时刻使用炸弹，如对手即将出完牌时</ListItem>
                    <ListItem>炸弹可以用来获得出牌权，控制游戏节奏</ListItem>
                  </ul>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">团队协作</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="orange" title="配合队友">
                  <ul className="space-y-1">
                    <ListItem>队友出大牌时，通常选择过牌</ListItem>
                    <ListItem>队友出小牌时，可以适当压制帮助</ListItem>
                    <ListItem>队友手牌少时，尽量让队友控制</ListItem>
                    <ListItem>不要炸队友，除非必要</ListItem>
                  </ul>
                </InfoCard>
                <InfoCard color="pink" title="压制对手">
                  <ul className="space-y-1">
                    <ListItem>对手手牌少时，优先压制</ListItem>
                    <ListItem>对手出小牌时，用大牌压制</ListItem>
                    <ListItem>对手即将出完牌时，用炸弹阻止</ListItem>
                  </ul>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">高级技巧</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="cyan" title="逢人配使用">
                  <ul className="space-y-1">
                    <ListItem>红桃级牌可以灵活使用，组成各种牌型</ListItem>
                    <ListItem>可以用来补全顺子、连对等牌型</ListItem>
                    <ListItem>也可以用来组成炸弹，增加压制力</ListItem>
                  </ul>
                </InfoCard>
                <InfoCard color="indigo" title="心理战术">
                  <ul className="space-y-1">
                    <ListItem>观察对手的出牌习惯，预判他们的策略</ListItem>
                    <ListItem>适时过牌，保留实力</ListItem>
                    <ListItem>在关键时刻出其不意，打乱对手节奏</ListItem>
                  </ul>
                </InfoCard>
              </div>
            </Card>
          </div>
        )

      case 'advanced':
        return (
          <div className="flex flex-col gap-6">
            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">抗贡规则详解</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="red" title="抗贡条件">
                  <ul className="space-y-1 text-red-900">
                    <li className="flex items-start gap-2"><span>•</span><span>必须拥有双大王（两张红王）才能抗贡</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>抗贡是失败方的权利，可以选择是否使用</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>抗贡后不需要进贡，直接开始新游戏</span></li>
                  </ul>
                </InfoCard>
                <InfoCard color="orange" title="抗贡策略分析">
                  <ul className="space-y-1 text-orange-900">
                    <li className="flex items-start gap-2"><span>•</span><span><strong>必须抗贡</strong>：只有双红大王，没有其他牌</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>必须抗贡</strong>：所有非王牌都是级牌</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>建议抗贡</strong>：最大进贡牌为A或更大</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>建议抗贡</strong>：有3张以上大牌（10及以上）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>可以抗贡</strong>：有2张以上大牌（Q及以上）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>不建议抗贡</strong>：只有小牌，牌力不足</span></li>
                  </ul>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">进贡还贡策略</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="blue" title="进贡策略">
                  <ul className="space-y-1 text-blue-900">
                    <li className="flex items-start gap-2"><span>•</span><span>进贡最大的牌（必须&gt;=10）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>不能进贡王或逢人配（红桃级牌）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>级牌可以进贡（非红桃级牌）</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>只向胜方头游、二游进贡</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>花色优先级：黑桃 &gt; 红桃 &gt; 梅花 &gt; 方块</span></li>
                  </ul>
                </InfoCard>
                <InfoCard color="green" title="还贡策略">
                  <ul className="space-y-1 text-green-900">
                    <li className="flex items-start gap-2"><span>•</span><span>还贡一张小于10的牌</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span>花色优先级：方块 &gt; 梅花 &gt; 红桃 &gt; 黑桃</span></li>
                  </ul>
                </InfoCard>
                <InfoCard color="purple" title="进贡还贡优势分析">
                  <ul className="space-y-1 text-purple-900">
                    <li className="flex items-start gap-2"><span>•</span><span><strong>还贡方大优</strong>：还贡牌比进贡牌大5点以上</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>还贡方小优</strong>：还贡牌比进贡牌大2-5点</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>双方平衡</strong>：还贡牌与进贡牌差距在2点以内</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>进贡方小优</strong>：进贡牌比还贡牌大2-5点</span></li>
                    <li className="flex items-start gap-2"><span>•</span><span><strong>进贡方大优</strong>：进贡牌比还贡牌大5点以上</span></li>
                  </ul>
                </InfoCard>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <h3 className="text-xl font-bold mb-4 text-neutral-900">特殊规则</h3>
              <div className="flex flex-col gap-4">
                <InfoCard color="pink" title="进贡还贡配对">
                  <p className="text-pink-900">
                    进贡还贡按照排名配对：头游配四游，二游配三游。这样可以确保进贡还贡的公平性。
                  </p>
                </InfoCard>
                <InfoCard color="indigo" title="级牌规则">
                  <p className="text-indigo-900">
                    级牌是当前等级对应的牌。例如，当前等级是2，那么2就是级牌。红桃级牌可以作为逢人配使用，可以代替任意牌组成牌型。
                  </p>
                </InfoCard>
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
        <div className="max-w-7xl mx-auto">
          {/* 返回按钮和标题 */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/')}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 侧边导航 */}
            <div className="lg:col-span-1">
              <Card
                variant="elevated"
                padding="md"
                className="sticky top-6"
              >
                <h2 className="text-lg font-bold text-neutral-900 mb-4">
                  规则目录
                </h2>
                <nav className="flex flex-col gap-2">
                  {sections.map((section) => (
                    <NavButton
                      key={section.id}
                      active={activeSection === section.id}
                      icon={section.icon}
                      label={section.title}
                      onClick={() => setActiveSection(section.id)}
                    />
                  ))}
                </nav>
              </Card>
            </div>

            {/* 内容区域 */}
            <div className="lg:col-span-3">
              <Card variant="elevated" padding="lg">
                {renderContent()}
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
