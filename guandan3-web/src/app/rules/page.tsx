'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { ArrowLeft, Book, Star, Shield, Zap } from 'lucide-react'

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

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    border: '2px solid #e5e7eb',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }

  const headingStyle = {
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1rem',
    color: '#111827',
  }

  const textStyle = {
    color: '#374151',
    lineHeight: 1.7,
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={headingStyle}>游戏概述</h3>
              <p style={{ ...textStyle, marginBottom: '1rem' }}>
                掼蛋是一种流行于江苏、安徽等地的扑克牌游戏，由4人参与，分为两队对抗。
                每队两人，对家为队友，共同协作争取胜利。
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>游戏人数</h4>
                  <p style={{ color: '#1e40af' }}>4人（两队对抗）</p>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.5rem' }}>使用牌数</h4>
                  <p style={{ color: '#166534' }}>两副扑克牌（108张）</p>
                </div>
                <div style={{ backgroundColor: '#faf5ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#581c87', marginBottom: '0.5rem' }}>获胜条件</h4>
                  <p style={{ color: '#6b21a8' }}>先出完牌的队伍获胜</p>
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '0.5rem' }}>升级机制</h4>
                  <p style={{ color: '#9a3412' }}>获胜方升级，失败方进贡</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>发牌规则</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#3b82f6' }}>•</span>
                  <span style={textStyle}>每人发27张牌，没有剩余底牌</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#3b82f6' }}>•</span>
                  <span style={textStyle}>庄家（第一个出牌的人）由上一局获胜方担任</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#3b82f6' }}>•</span>
                  <span style={textStyle}>首局随机确定庄家</span>
                </li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>出牌规则</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>庄家首先出牌，然后按逆时针顺序轮流出牌</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>后出牌者必须出与上家相同类型的牌，且牌面要更大</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>如果无法或不愿出牌，可以选择"过牌"</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>当连续3人过牌后，最后出牌的人获得新一轮出牌权</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>炸弹可以压过任何非炸弹牌型</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>王炸（四王）是最大的牌型，可以压过任何牌</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span style={{ color: '#22c55e' }}>•</span>
                  <span style={textStyle}>双王、三王不是炸弹</span>
                </li>
              </ul>
            </div>
          </div>
        )

      case 'cardTypes':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={headingStyle}>基本牌型</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>单张</h4>
                  <p style={textStyle}>任意一张牌</p>
                </div>
                <div style={{ borderLeft: '4px solid #22c55e', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.5rem' }}>对子</h4>
                  <p style={textStyle}>两张点数相同的牌</p>
                </div>
                <div style={{ borderLeft: '4px solid #a855f7', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#581c87', marginBottom: '0.5rem' }}>三张</h4>
                  <p style={textStyle}>三张点数相同的牌</p>
                </div>
                <div style={{ borderLeft: '4px solid #f97316', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '0.5rem' }}>三带二</h4>
                  <p style={textStyle}>三张相同点数 + 两张对子（两张任意牌必须是对子）</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>顺子牌型</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #06b6d4', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#0e7490', marginBottom: '0.5rem' }}>顺子</h4>
                  <p style={textStyle}>五张或更多连续点数的单张（至少5张）</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>例如：3-4-5-6-7</p>
                </div>
                <div style={{ borderLeft: '4px solid #ec4899', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#831843', marginBottom: '0.5rem' }}>连对</h4>
                  <p style={textStyle}>三对或更多连续点数的对子（至少3对）</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>例如：33-44-55</p>
                </div>
                <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.5rem' }}>连三</h4>
                  <p style={textStyle}>两个或更多连续点数的三张（至少2个）</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>例如：333-444</p>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>特殊牌型</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#7f1d1d', marginBottom: '0.5rem' }}>炸弹</h4>
                  <p style={textStyle}>四张或更多相同点数的牌</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>例如：4444、55555</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>炸弹可以压过任何非炸弹牌型</p>
                </div>
                <div style={{ borderLeft: '4px solid #eab308', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#713f12', marginBottom: '0.5rem' }}>王炸</h4>
                  <p style={textStyle}>四张王（两张大王 + 两张小王）</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>王炸是最大的牌型，可以压过任何牌</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>注意：双王、三王不是炸弹</p>
                </div>
                <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#064e3b', marginBottom: '0.5rem' }}>逢人配</h4>
                  <p style={textStyle}>红桃级牌可以作为任意牌使用</p>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>例如：级牌是2，红桃2可以代替任意牌组成牌型</p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'tribute':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={headingStyle}>进贡规则</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#7f1d1d', marginBottom: '0.5rem' }}>进贡条件</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#991b1b' }}>
                    <li>• 失败方需要向获胜方进贡</li>
                    <li>• 每人进贡一张最大的牌（且必须&gt;=10）</li>
                    <li>• 有王必须进贡，但不能进逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡，不向三游进贡</li>
                  </ul>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.5rem' }}>抗贡条件</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#166534' }}>
                    <li>• 需要持有双大王（两张红大王）才能抗贡</li>
                    <li>• 如果失败方有一人持有双大王，两人都无需进贡</li>
                    <li>• 抗贡后不需要进贡和还贡</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>还贡规则</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>还贡方式</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e40af' }}>
                    <li>• 获胜方收到进贡牌后，需要还贡一张牌</li>
                    <li>• 还贡一张小于10的牌</li>
                    <li>• 还贡牌不能是进贡牌</li>
                  </ul>
                </div>
                <div style={{ backgroundColor: '#faf5ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#581c87', marginBottom: '0.5rem' }}>进贡还贡流程</h4>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#6b21a8' }}>
                    <li>1. 失败方每人选择一张最大的牌进贡</li>
                    <li>2. 获胜方每人收到一张进贡牌</li>
                    <li>3. 获胜方每人还贡一张小于10的牌</li>
                    <li>4. 失败方每人收到一张还贡牌</li>
                    <li>5. 进贡还贡完成后开始新游戏</li>
                  </ol>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>抗贡规则</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                  <p style={{ color: '#166534' }}>
                    如果失败方有一人持有双大王，两人都无需进贡
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      case 'strategy':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={headingStyle}>基本策略</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>记牌技巧</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 记住已经出过的牌，特别是大牌和炸弹</li>
                    <li style={textStyle}>• 关注对手和队友的出牌，推断他们的手牌</li>
                    <li style={textStyle}>• 注意哪些牌型已经出完，避免被压制</li>
                  </ul>
                </div>
                <div style={{ borderLeft: '4px solid #22c55e', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.5rem' }}>出牌时机</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 手牌少时（&lt;=5张）要谨慎，避免被压制</li>
                    <li style={textStyle}>• 手牌多时可以主动出牌，控制节奏</li>
                    <li style={textStyle}>• 对手手牌少时，尽量出大牌压制</li>
                  </ul>
                </div>
                <div style={{ borderLeft: '4px solid #a855f7', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#581c87', marginBottom: '0.5rem' }}>炸弹使用</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 炸弹是宝贵的资源，不要轻易使用</li>
                    <li style={textStyle}>• 在关键时刻使用炸弹，如对手即将出完牌时</li>
                    <li style={textStyle}>• 炸弹可以用来获得出牌权，控制游戏节奏</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>团队协作</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #f97316', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '0.5rem' }}>配合队友</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 队友出大牌时，通常选择过牌</li>
                    <li style={textStyle}>• 队友出小牌时，可以适当压制帮助</li>
                    <li style={textStyle}>• 队友手牌少时，尽量让队友控制</li>
                    <li style={textStyle}>• 不要炸队友，除非必要</li>
                  </ul>
                </div>
                <div style={{ borderLeft: '4px solid #ec4899', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#831843', marginBottom: '0.5rem' }}>压制对手</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 对手手牌少时，优先压制</li>
                    <li style={textStyle}>• 对手出小牌时，用大牌压制</li>
                    <li style={textStyle}>• 对手即将出完牌时，用炸弹阻止</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>高级技巧</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ borderLeft: '4px solid #06b6d4', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#0e7490', marginBottom: '0.5rem' }}>逢人配使用</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 红桃级牌可以灵活使用，组成各种牌型</li>
                    <li style={textStyle}>• 可以用来补全顺子、连对等牌型</li>
                    <li style={textStyle}>• 也可以用来组成炸弹，增加压制力</li>
                  </ul>
                </div>
                <div style={{ borderLeft: '4px solid #6366f1', paddingLeft: '1rem' }}>
                  <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.5rem' }}>心理战术</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li style={textStyle}>• 观察对手的出牌习惯，预判他们的策略</li>
                    <li style={textStyle}>• 适时过牌，保留实力</li>
                    <li style={textStyle}>• 在关键时刻出其不意，打乱对手节奏</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )

      case 'advanced':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={cardStyle}>
              <h3 style={headingStyle}>抗贡规则详解</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fef2f2', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#7f1d1d', marginBottom: '0.5rem' }}>抗贡条件</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#991b1b' }}>
                    <li>• 必须拥有双大王（两张红王）才能抗贡</li>
                    <li>• 抗贡是失败方的权利，可以选择是否使用</li>
                    <li>• 抗贡后不需要进贡，直接开始新游戏</li>
                  </ul>
                </div>
                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#7c2d12', marginBottom: '0.5rem' }}>抗贡策略分析</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#9a3412' }}>
                    <li>• <strong>必须抗贡</strong>：只有双红大王，没有其他牌</li>
                    <li>• <strong>必须抗贡</strong>：所有非王牌都是级牌</li>
                    <li>• <strong>建议抗贡</strong>：最大进贡牌为A或更大</li>
                    <li>• <strong>建议抗贡</strong>：有3张以上大牌（10及以上）</li>
                    <li>• <strong>可以抗贡</strong>：有2张以上大牌（Q及以上）</li>
                    <li>• <strong>不建议抗贡</strong>：只有小牌，牌力不足</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>进贡还贡策略</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e3a8a', marginBottom: '0.5rem' }}>进贡策略</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#1e40af' }}>
                    <li>• 进贡最大的牌（必须&gt;=10）</li>
                    <li>• 不能进贡王或逢人配（红桃级牌）</li>
                    <li>• 级牌可以进贡（非红桃级牌）</li>
                    <li>• 只向胜方头游、二游进贡</li>
                    <li>• 花色优先级：黑桃 &gt; 红桃 &gt; 梅花 &gt; 方块</li>
                  </ul>
                </div>
                <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#14532d', marginBottom: '0.5rem' }}>还贡策略</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#166534' }}>
                    <li>• 还贡一张小于10的牌</li>
                    <li>• 花色优先级：方块 &gt; 梅花 &gt; 红桃 &gt; 黑桃</li>
                  </ul>
                </div>
                <div style={{ backgroundColor: '#faf5ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#581c87', marginBottom: '0.5rem' }}>进贡还贡优势分析</h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#6b21a8' }}>
                    <li>• <strong>还贡方大优</strong>：还贡牌比进贡牌大5点以上</li>
                    <li>• <strong>还贡方小优</strong>：还贡牌比进贡牌大2-5点</li>
                    <li>• <strong>双方平衡</strong>：还贡牌与进贡牌差距在2点以内</li>
                    <li>• <strong>进贡方小优</strong>：进贡牌比还贡牌大2-5点</li>
                    <li>• <strong>进贡方大优</strong>：进贡牌比还贡牌大5点以上</li>
                  </ul>
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={headingStyle}>特殊规则</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fdf2f8', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#831843', marginBottom: '0.5rem' }}>进贡还贡配对</h4>
                  <p style={{ color: '#9d174d' }}>
                    进贡还贡按照排名配对：头游配四游，二游配三游。这样可以确保进贡还贡的公平性。
                  </p>
                </div>
                <div style={{ backgroundColor: '#eef2ff', padding: '1rem', borderRadius: '12px' }}>
                  <h4 style={{ fontWeight: 600, color: '#3730a3', marginBottom: '0.5rem' }}>级牌规则</h4>
                  <p style={{ color: '#4f46e5' }}>
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

  const navButtonStyle = (isActive: boolean) => ({
    width: '100%',
    textAlign: 'left' as const,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: isActive ? '#1a472a' : 'transparent',
    color: isActive ? 'white' : '#374151',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  })

  const navContainerStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    border: '2px solid #e5e7eb',
    padding: '1rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    position: 'sticky' as const,
    top: '1.5rem',
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', padding: '1rem', paddingTop: '80px' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* 返回按钮和标题 */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid transparent',
                backgroundColor: 'transparent',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
              返回首页
            </button>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
              游戏规则
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              了解掼蛋的规则和策略，提升你的游戏技巧
            </p>
          </div>

          {/* 主体内容 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {/* 侧边导航 */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={navContainerStyle}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>
                  规则目录
                </h2>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        style={navButtonStyle(activeSection === section.id)}
                        onMouseEnter={(e) => {
                          if (activeSection !== section.id) {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeSection !== section.id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                        <span>{section.title}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* 内容区域 */}
            <div style={{ gridColumn: 'span 3' }}>
              <div style={cardStyle}>
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
