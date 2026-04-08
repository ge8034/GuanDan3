/**
 * Design System 测试页面
 *
 * 验证所有新组件
 */

'use client'

import { Button } from '@/design-system/components/atoms'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/design-system/components/atoms'
import { Input } from '@/design-system/components/atoms'
import { Avatar, AvatarGroup } from '@/design-system/components/atoms'
import { Badge, BadgeAnchor } from '@/design-system/components/atoms'
import { Spinner } from '@/design-system/components/atoms'
import { CheckCircle2, XCircle, Plus, Trash2, Send, Search } from 'lucide-react'
import { useState } from 'react'

export default function DesignSystemPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const handleLoading = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-beige-light py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* 页头 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-poker-table-900">
            掼蛋3 Design System
          </h1>
          <p className="text-lg text-neutral-600">
            基于 Impeccable Design 规范的组件库
          </p>
          <Badge variant="primary">v1.0.0</Badge>
        </div>

        {/* Button 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Button 按钮</CardTitle>
            <CardDescription>8种交互状态的按钮组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 变体 */}
            <div>
              <p className="text-sm font-semibold mb-3">视觉变体</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">主要按钮</Button>
                <Button variant="secondary">次要按钮</Button>
                <Button variant="outline">轮廓按钮</Button>
                <Button variant="ghost">幽灵按钮</Button>
                <Button variant="danger">危险按钮</Button>
                <Button variant="success">成功按钮</Button>
                <Button variant="gold">金色按钮</Button>
              </div>
            </div>

            {/* 尺寸 */}
            <div>
              <p className="text-sm font-semibold mb-3">尺寸</p>
              <div className="flex items-end gap-3">
                <Button size="xs">超小</Button>
                <Button size="sm">小</Button>
                <Button size="md">中</Button>
                <Button size="lg">大</Button>
                <Button size="xl">超大</Button>
              </div>
            </div>

            {/* 8种状态 */}
            <div>
              <p className="text-sm font-semibold mb-3">8种交互状态</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">1. Default</p>
                  <Button size="sm">默认</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">2. Hover</p>
                  <Button size="sm">悬停</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">3. Focus</p>
                  <Button size="sm">聚焦</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">5. Disabled</p>
                  <Button size="sm" disabled>禁用</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">6. Loading</p>
                  <Button size="sm" loading>加载中</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">7. Error</p>
                  <Button size="sm" error>错误</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">8. Success</p>
                  <Button size="sm" success>成功</Button>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500">交互测试</p>
                  <Button size="sm" loading={isLoading} onClick={handleLoading}>
                    {isLoading ? '加载中...' : '点击加载'}
                  </Button>
                </div>
              </div>
            </div>

            {/* 带图标 */}
            <div>
              <p className="text-sm font-semibold mb-3">带图标</p>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Plus className="h-5 w-5" />}>新建</Button>
                <Button rightIcon={<Send className="h-5 w-5" />} variant="secondary">发送</Button>
                <Button leftIcon={<CheckCircle2 className="h-5 w-5" />} variant="outline">确认</Button>
                <Button leftIcon={<Trash2 className="h-5 w-5" />} variant="danger">删除</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Card 卡片</CardTitle>
            <CardDescription>内容容器组件</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Card variant="default">
                <CardContent className="pt-6">
                  <p className="font-semibold">默认卡片</p>
                  <p className="text-sm text-neutral-600 mt-2">标准边框和阴影</p>
                </CardContent>
              </Card>

              <Card variant="elevated" hoverable>
                <CardContent className="pt-6">
                  <p className="font-semibold">悬停卡片</p>
                  <p className="text-sm text-neutral-600 mt-2">悬停时阴影加深，上移</p>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent className="pt-6">
                  <p className="font-semibold">轮廓卡片</p>
                  <p className="text-sm text-neutral-600 mt-2">仅边框，透明背景</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Input 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Input 输入框</CardTitle>
            <CardDescription>表单输入组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold mb-2">默认</p>
                <Input placeholder="请输入内容..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">带图标</p>
                <Input
                  leftIcon={<Search className="h-5 w-5" />}
                  placeholder="搜索..."
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">填充样式</p>
                <Input variant="filled" placeholder="填充输入框" />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">轮廓样式</p>
                <Input variant="outlined" placeholder="轮廓输入框" />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">错误状态</p>
                <Input
                  error
                  errorMessage="用户名不能为空"
                  placeholder="用户名"
                />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">禁用状态</p>
                <Input disabled placeholder="禁用输入框" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avatar 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar 头像</CardTitle>
            <CardDescription>用户头像组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-3">尺寸</p>
              <div className="flex items-end gap-4">
                <Avatar size="xs" alt="XS" />
                <Avatar size="sm" alt="SM" />
                <Avatar size="md" alt="MD" />
                <Avatar size="lg" alt="LG" />
                <Avatar size="xl" alt="XL" />
                <Avatar size="2xl" alt="2XL" />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">状态指示</p>
              <div className="flex gap-4">
                <Avatar alt="在线" status="online" />
                <Avatar alt="离线" status="offline" />
                <Avatar alt="离开" status="away" />
                <Avatar alt="忙碌" status="busy" />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">首字母显示</p>
              <div className="flex gap-4">
                <Avatar alt="张三" />
                <Avatar alt="李四" />
                <Avatar alt="王五" />
                <Avatar alt="赵六" />
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">头像组</p>
              <AvatarGroup max={4} overlap={3}>
                <Avatar alt="用户1" src="/avatar1.jpg" />
                <Avatar alt="用户2" />
                <Avatar alt="用户3" />
                <Avatar alt="用户4" />
                <Avatar alt="用户5" />
                <Avatar alt="用户6" />
                <Avatar alt="用户7" />
              </AvatarGroup>
            </div>
          </CardContent>
        </Card>

        {/* Badge 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Badge 徽章</CardTitle>
            <CardDescription>标签和徽章组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-semibold mb-3">变体</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">默认</Badge>
                <Badge variant="primary">主要</Badge>
                <Badge variant="secondary">次要</Badge>
                <Badge variant="success">成功</Badge>
                <Badge variant="warning">警告</Badge>
                <Badge variant="error">错误</Badge>
                <Badge variant="gold">金色</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">尺寸</p>
              <div className="flex items-center gap-2">
                <Badge size="sm">小徽章</Badge>
                <Badge size="md">中徽章</Badge>
                <Badge size="lg">大徽章</Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">数字徽章</p>
              <div className="flex items-center gap-4">
                <BadgeAnchor count={5}>
                  <Button variant="secondary">通知</Button>
                </BadgeAnchor>
                <BadgeAnchor count={99}>
                  <Button variant="secondary">消息</Button>
                </BadgeAnchor>
                <BadgeAnchor count={999} max={99}>
                  <Button variant="secondary">邮件</Button>
                </BadgeAnchor>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3">点状徽章</p>
              <div className="flex items-center gap-4">
                <BadgeAnchor showDot>
                  <Button variant="ghost">状态</Button>
                </BadgeAnchor>
                <BadgeAnchor showDot>
                  <Avatar alt="用户" />
                </BadgeAnchor>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Spinner 组件展示 */}
        <Card>
          <CardHeader>
            <CardTitle>Spinner 加载器</CardTitle>
            <CardDescription>加载状态指示器</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xs" />
                <p className="text-xs text-neutral-500">XS</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" />
                <p className="text-xs text-neutral-500">SM</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" />
                <p className="text-xs text-neutral-500">MD</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" />
                <p className="text-xs text-neutral-500">LG</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xl" />
                <p className="text-xs text-neutral-500">XL</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner variant="gold" size="lg" />
                <p className="text-xs text-neutral-500">金色</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Poker 主题示例 */}
        <Card className="bg-poker-table-500 border-poker-table-600">
          <CardHeader>
            <CardTitle className="text-white">Poker 游戏主题</CardTitle>
            <CardDescription className="text-poker-table-200">深绿牌桌背景的组件效果</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">开始游戏</Button>
              <Button variant="gold" leftIcon={<CheckCircle2 className="h-5 w-5" />}>
                确认出牌
              </Button>
              <Button variant="outline">取消</Button>
              <Button variant="danger" leftIcon={<Trash2 className="h-5 w-5" />}>
                离开房间
              </Button>
              <Button loading>加载中...</Button>
            </div>
          </CardContent>
        </Card>

        {/* 设计Token说明 */}
        <Card>
          <CardHeader>
            <CardTitle>Design Tokens</CardTitle>
            <CardDescription>设计Token系统概览</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">🎨 颜色系统</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• OKLCH 色彩空间</li>
                  <li>• 染色中性色</li>
                  <li>• Poker 主题品牌色</li>
                  <li>• 60-30-10 比例规则</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">✏️ 排版系统</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 5级字体系统 (1.25)</li>
                  <li>• 垂直节奏 (1.6)</li>
                  <li>• 避免默认字体</li>
                  <li>• 行长限制 (65ch)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">📐 空间系统</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 4pt 基数系统</li>
                  <li>• 语义化命名</li>
                  <li>• gap 优于 margin</li>
                  <li>• 触摸目标 44px+</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">🎬 动效系统</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• 100/300/500 规则</li>
                  <li>• ease-out 缓动</li>
                  <li>• 仅 transform/opacity</li>
                  <li>• reduced-motion 支持</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">♿ 可访问性</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• ARIA 标签完整</li>
                  <li>• 键盘导航支持</li>
                  <li>• 焦点环 (2px)</li>
                  <li>• WCAG 2.1 AA</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">📖 参考资料</h3>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• <a href="https://github.com/pbakaus/impeccable" className="text-poker-table-500 hover:underline" target="_blank">Impeccable Design</a></li>
                  <li>• 完整 Design Tokens</li>
                  <li>• Storybook 文档</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
