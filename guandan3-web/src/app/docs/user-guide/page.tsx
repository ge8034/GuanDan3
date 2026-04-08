'use client'

import Link from 'next/link'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { useState } from 'react'

// 内联样式按钮组件
function InlineButton({
  children,
  onClick,
  href,
  variant = 'ghost',
  style: customStyle
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
  variant?: 'ghost'
  style?: React.CSSProperties
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '2px solid transparent',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
    textDecoration: 'none',
    ...customStyle,
  }

  const variantStyles = {
    ghost: {
      backgroundColor: 'transparent',
      color: '#6b7280',
    },
  }

  const style = { ...baseStyle, ...variantStyles[variant] }

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

// 内联样式卡片组件
function InlineCard({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </div>
  )
}

export default function UserGuidePage() {
  const router = useRouter()
  const { theme } = useTheme()

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '2rem 1rem' }}>
          {/* 头部 */}
          <div style={{ marginBottom: '2rem' }}>
            <InlineButton onClick={() => router.push('/help')} style={{ marginBottom: '1rem' }}>
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回帮助中心
            </InlineButton>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <BookOpen style={{ width: '32px', height: '32px', color: '#1a472a' }} />
              <h1 style={{ fontSize: '2.25rem', fontWeight: 700, color: '#111827' }}>
                掼蛋3 用户指南
              </h1>
            </div>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              完整的游戏使用指南，帮助您快速上手掼蛋3
            </p>
          </div>

          {/* 内容卡片 */}
          <InlineCard>
            <div style={{ padding: '2rem' }}>
              <div style={{ maxWidth: 'none' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>目录</h2>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><a href="#quick-start" style={{ color: '#1a472a', textDecoration: 'none' }}>快速开始</a></li>
                  <li><a href="#game-rules" style={{ color: '#1a472a', textDecoration: 'none' }}>游戏规则</a></li>
                  <li><a href="#interface" style={{ color: '#1a472a', textDecoration: 'none' }}>界面说明</a></li>
                  <li><a href="#operations" style={{ color: '#1a472a', textDecoration: 'none' }}>游戏操作</a></li>
                  <li><a href="#room-system" style={{ color: '#1a472a', textDecoration: 'none' }}>房间系统</a></li>
                  <li><a href="#friend-system" style={{ color: '#1a472a', textDecoration: 'none' }}>好友系统</a></li>
                  <li><a href="#settings" style={{ color: '#1a472a', textDecoration: 'none' }}>设置选项</a></li>
                  <li><a href="#faq" style={{ color: '#1a472a', textDecoration: 'none' }}>常见问题</a></li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="quick-start" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>快速开始</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>注册账号</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>访问 guandan3.com</li>
                  <li>点击右上角的"注册"按钮</li>
                  <li>填写用户名、邮箱和密码</li>
                  <li>验证邮箱地址</li>
                  <li>完成注册</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>开始游戏</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>登录后进入游戏大厅</li>
                  <li>选择一个房间或创建新房间</li>
                  <li>等待其他玩家加入</li>
                  <li>游戏开始后按照规则出牌</li>
                </ol>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="game-rules" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>游戏规则</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>基本规则</h3>
                <p style={{ color: '#374151', lineHeight: 1.7 }}>
                  掼蛋是一种四人扑克牌游戏，使用两副牌（108张），分为两队对抗。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>牌型说明</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>单张</strong>：任意一张牌</li>
                  <li><strong>对子</strong>：两张点数相同的牌</li>
                  <li><strong>三张</strong>：三张点数相同的牌</li>
                  <li><strong>三带二</strong>：三张相同点数的牌 + 两张对子（两张任意牌必须是对子）</li>
                  <li><strong>顺子</strong>：五张或更多连续点数的单牌（不能包含2和王）</li>
                  <li><strong>连对</strong>：三对或更多连续点数的对子</li>
                  <li><strong>三连</strong>：两个或更多连续的三张</li>
                  <li><strong>炸弹</strong>：四张或更多相同点数的牌</li>
                  <li><strong>王炸</strong>：四张王（两张大王+两张小王）- 注意：双王、三王不是炸弹</li>
                  <li><strong>逢人配</strong>：红桃级牌可以当作任意牌使用</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>牌型大小</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>王炸（四王）{'>'} 六张炸弹 {'>'} 五张炸弹 {'>'} 四张炸弹</li>
                  <li>同类型牌型比较最大牌的点数</li>
                  <li>级牌（当前回合的级数）大于A</li>
                </ul>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>游戏流程</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>发牌</strong>：每人27张牌，没有底牌</li>
                  <li><strong>叫主</strong>：第一轮由持有红桃级牌的玩家叫主</li>
                  <li><strong>出牌</strong>：按逆时针顺序出牌</li>
                  <li><strong>跟牌</strong>：必须跟出相同类型的牌，没有则可以出任意牌</li>
                  <li><strong>结算</strong>：先出完牌的一方获胜</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>升级规则</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>双人获胜（头游+二游同队）：升3级</li>
                  <li>三人获胜（头游+三游同队）：升2级</li>
                  <li>单人获胜（头游+末游同队）：升1级</li>
                  <li>末游玩家所在队伍不降级</li>
                  <li>先升到A级的一方获胜</li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="interface" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>界面说明</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>游戏大厅</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>房间列表</strong>：显示所有可用房间</li>
                  <li><strong>创建房间</strong>：创建自定义房间</li>
                  <li><strong>快速开始</strong>：自动匹配进入游戏</li>
                  <li><strong>好友列表</strong>：查看在线好友</li>
                </ul>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>游戏界面</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>玩家信息</strong>：显示四位玩家的头像、昵称和牌数</li>
                  <li><strong>手牌区域</strong>：显示当前玩家的手牌</li>
                  <li><strong>出牌区域</strong>：显示已出的牌</li>
                  <li><strong>操作按钮</strong>：出牌、不出、提示等按钮</li>
                  <li><strong>游戏信息</strong>：显示当前级数、轮次等信息</li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="operations" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>游戏操作</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>出牌</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击要出的牌选中（选中的牌会向上移动）</li>
                  <li>点击"出牌"按钮</li>
                  <li>如果牌型不符合规则，系统会提示</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>不出</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击"不出"按钮</li>
                  <li>跳过当前轮次</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>提示</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击"提示"按钮</li>
                  <li>系统会自动选择可以出的牌</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>排序</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击"排序"按钮</li>
                  <li>手牌会按照点数从大到小排列</li>
                </ol>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="room-system" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>房间系统</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>创建房间</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击"创建房间"按钮</li>
                  <li>设置房间名称和密码（可选）</li>
                  <li>选择游戏模式（标准/快速）</li>
                  <li>点击"创建"完成</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>加入房间</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>在房间列表中选择房间</li>
                  <li>点击"加入"按钮</li>
                  <li>如果房间有密码，输入密码后加入</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>房间设置</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>房间名称</strong>：自定义房间名称</li>
                  <li><strong>房间密码</strong>：设置密码保护房间</li>
                  <li><strong>游戏模式</strong>：选择标准或快速模式</li>
                  <li><strong>AI难度</strong>：选择AI对手的难度</li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="friend-system" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>好友系统</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>添加好友</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击好友列表中的"添加好友"</li>
                  <li>输入对方用户名</li>
                  <li>发送好友请求</li>
                  <li>对方接受后成为好友</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>邀请好友</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>在好友列表中选择好友</li>
                  <li>点击"邀请游戏"</li>
                  <li>好友收到邀请后可以加入</li>
                </ol>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>好友聊天</h3>
                <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>点击好友头像</li>
                  <li>打开聊天窗口</li>
                  <li>发送消息</li>
                </ol>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="settings" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>设置选项</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>游戏设置</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>音效</strong>：开启/关闭游戏音效</li>
                  <li><strong>音乐</strong>：开启/关闭背景音乐</li>
                  <li><strong>音量</strong>：调整音效和音乐音量</li>
                  <li><strong>动画</strong>：开启/关闭出牌动画</li>
                </ul>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>显示设置</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>主题</strong>：选择浅色/深色主题</li>
                  <li><strong>牌面样式</strong>：选择不同的牌面样式</li>
                  <li><strong>背景</strong>：选择游戏背景</li>
                </ul>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>账号设置</h3>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li><strong>修改密码</strong>：修改登录密码</li>
                  <li><strong>绑定邮箱</strong>：绑定或更换邮箱</li>
                  <li><strong>隐私设置</strong>：设置个人信息可见性</li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 id="faq" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>常见问题</h2>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 如何快速上手掼蛋？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 建议先在练习模式中熟悉基本规则，然后在低难度AI对战中练习。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 游戏卡顿怎么办？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 检查网络连接，关闭其他占用带宽的应用，或尝试刷新页面。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 如何提高游戏水平？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 多练习，观察高手的出牌策略，学习牌型组合技巧，培养团队配合意识。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 游戏数据会丢失吗？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 不会，所有游戏数据都保存在云端，登录后即可恢复。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 如何联系客服？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 点击游戏内的"帮助"按钮，选择"联系客服"即可。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 支持哪些设备？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 支持PC浏览器、手机浏览器和平板浏览器，建议使用Chrome、Safari或Edge浏览器。
                </p>

                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>Q: 游戏是免费的吗？</h3>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  A: 游戏完全免费，包含所有基础功能。未来可能会推出付费装饰品。
                </p>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>技术支持</h2>
                <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: '1rem' }}>
                  如果您遇到任何问题，请通过以下方式联系我们：
                </p>
                <ul style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: 1.7 }}>
                  <li>邮箱：support@guandan3.com</li>
                  <li>客服热线：400-XXX-XXXX</li>
                  <li>在线客服：游戏内"帮助" {'->'} "在线客服"</li>
                </ul>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>版本信息</h2>
                <p style={{ color: '#374151', lineHeight: 1.7 }}>
                  当前版本：v1.0.0<br />
                  更新日期：2024年3月
                </p>

                <hr style={{ border: 'none', borderTop: '2px solid #e5e7eb', margin: '1.5rem 0' }} />

                <p style={{ textAlign: 'center', fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>
                  感谢您选择掼蛋3，祝您游戏愉快！
                </p>
              </div>
            </div>
          </InlineCard>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
