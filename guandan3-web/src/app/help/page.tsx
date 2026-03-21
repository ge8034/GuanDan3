import Link from 'next/link'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Book, HelpCircle, MessageCircle, Settings, Users, Zap } from 'lucide-react'

export default function HelpPage() {
  const helpCategories = [
    {
      title: '快速入门',
      description: '了解如何开始游戏',
      icon: Zap,
      items: [
        { title: '注册账号', href: '#register' },
        { title: '开始游戏', href: '#start' },
        { title: '基本操作', href: '#operations' }
      ]
    },
    {
      title: '游戏规则',
      description: '学习掼蛋的游戏规则',
      icon: Book,
      items: [
        { title: '牌型说明', href: '#card-types' },
        { title: '游戏流程', href: '#game-flow' },
        { title: '升级规则', href: '#level-up' }
      ]
    },
    {
      title: '房间系统',
      description: '了解房间创建和管理',
      icon: Users,
      items: [
        { title: '创建房间', href: '#create-room' },
        { title: '加入房间', href: '#join-room' },
        { title: '房间设置', href: '#room-settings' }
      ]
    },
    {
      title: '好友系统',
      description: '管理好友和社交功能',
      icon: MessageCircle,
      items: [
        { title: '添加好友', href: '#add-friend' },
        { title: '邀请好友', href: '#invite-friend' },
        { title: '好友聊天', href: '#friend-chat' }
      ]
    },
    {
      title: '设置选项',
      description: '自定义游戏体验',
      icon: Settings,
      items: [
        { title: '游戏设置', href: '#game-settings' },
        { title: '显示设置', href: '#display-settings' },
        { title: '账号设置', href: '#account-settings' }
      ]
    },
    {
      title: '常见问题',
      description: '查找常见问题的解答',
      icon: HelpCircle,
      items: [
        { title: '账号问题', href: '#account-faq' },
        { title: '游戏问题', href: '#game-faq' },
        { title: '技术问题', href: '#tech-faq' }
      ]
    }
  ]

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">帮助中心</h1>
          <p className="text-lg text-muted-foreground">
            欢迎来到掼蛋3帮助中心，这里可以找到您需要的所有帮助信息
          </p>
        </div>

        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索帮助内容..."
              className="w-full px-4 py-3 pl-12 rounded-lg border border-input bg-background"
            />
            <HelpCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {helpCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.items.map((item) => (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          className="text-sm text-primary hover:underline"
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>用户指南</CardTitle>
              <CardDescription>完整的游戏使用指南</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                查看详细的用户指南，了解游戏的所有功能和操作方法。
              </p>
              <Button asChild>
                <Link href="/docs/user-guide">查看用户指南</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>常见问题</CardTitle>
              <CardDescription>快速找到问题答案</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                浏览常见问题解答，快速解决您遇到的问题。
              </p>
              <Button asChild variant="outline">
                <Link href="/docs/faq">查看常见问题</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-primary/5">
          <CardHeader>
            <CardTitle>需要更多帮助？</CardTitle>
            <CardDescription>我们的客服团队随时为您服务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">邮箱</div>
                <div className="text-sm text-muted-foreground">support@guandan3.com</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">客服热线</div>
                <div className="text-sm text-muted-foreground">400-XXX-XXXX</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">工作时间</div>
                <div className="text-sm text-muted-foreground">9:00-22:00</div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Button size="lg">联系在线客服</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
