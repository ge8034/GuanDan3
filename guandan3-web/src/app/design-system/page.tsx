'use client'

import React, { useState } from 'react'
import CloudMountainBackground from '@/components/backgrounds/CloudMountainBackground'
import { Button } from '@/components/ui/Button'
import Card, { CardHeader, CardBody, CardFooter } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Toast from '@/components/ui/Toast'
import Modal from '@/components/ui/Modal'
import { colors, typography } from '@/lib/design-tokens'
import * as Icons from '@/components/icons/LandscapeIcons'

const ColorSwatch = ({ color, name, hex }: { color: string; name: string; hex: string }) => (
  <div className="flex flex-col gap-2">
    <div 
      className="w-full h-24 rounded-lg shadow-sm border border-gray-200"
      style={{ backgroundColor: color }}
    />
    <div className="text-sm">
      <p className="font-medium text-gray-900">{name}</p>
      <p className="text-gray-500 font-mono text-xs">{hex}</p>
    </div>
  </div>
)

export default function DesignSystemPage() {
  const [toast, setToast] = useState<{ message: string; kind: 'success' | 'error' | 'warning' | 'info' } | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')

  const tabs = [
    { id: 'colors', label: '颜色系统' },
    { id: 'typography', label: '排版系统' },
    { id: 'components', label: 'UI组件' },
    { id: 'icons', label: '图标库' },
  ]

  const showToast = (kind: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ message: `这是一个 ${kind} 类型的消息提示`, kind })
  }

  return (
    <CloudMountainBackground>
      <div className="min-h-screen p-8 text-gray-900 font-serif">
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <Toast
              message={toast.message}
              kind={toast.kind}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="示例模态框"
        >
          <div className="space-y-4">
            <p>这是一个符合富春山居图主题的模态框组件。</p>
            <p>它包含了标题、关闭按钮和自定义内容区域。</p>
            <p>背景使用了主题米色，并带有模糊效果。</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
              <Button onClick={() => setIsModalOpen(false)}>确认</Button>
            </div>
          </div>
        </Modal>

        <header className="max-w-7xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-[#1A4A0A] mb-4">富春山居图设计系统</h1>
          <p className="text-xl text-gray-600">基于青绿山水画风的现代化UI组件库</p>
        </header>

        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 mb-8 border-b border-[#D3D3D3] pb-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-[#6BA539]'
                    : 'text-gray-600 hover:text-[#6BA539]'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6BA539]" />
                )}
              </button>
            ))}
          </div>

          {activeTab === 'colors' && (
            <div className="space-y-12 animate-fade-in">
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">主色调 (Primary)</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <ColorSwatch color={colors.primary[50]} name="Primary 50" hex={colors.primary[50]} />
                  <ColorSwatch color={colors.primary[100]} name="Primary 100" hex={colors.primary[100]} />
                  <ColorSwatch color={colors.primary[300]} name="Primary 300" hex={colors.primary[300]} />
                  <ColorSwatch color={colors.primary[500]} name="Primary 500" hex={colors.primary[500]} />
                  <ColorSwatch color={colors.primary[700]} name="Primary 700" hex={colors.primary[700]} />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">辅助色 (Secondary)</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <ColorSwatch color={colors.secondary[50]} name="Secondary 50" hex={colors.secondary[50]} />
                  <ColorSwatch color={colors.secondary[100]} name="Secondary 100" hex={colors.secondary[100]} />
                  <ColorSwatch color={colors.secondary[300]} name="Secondary 300" hex={colors.secondary[300]} />
                  <ColorSwatch color={colors.secondary[500]} name="Secondary 500" hex={colors.secondary[500]} />
                  <ColorSwatch color={colors.secondary[700]} name="Secondary 700" hex={colors.secondary[700]} />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">中性色 (Neutral)</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  <ColorSwatch color={colors.neutral[100]} name="Neutral 100 (Beige)" hex={colors.neutral[100]} />
                  <ColorSwatch color={colors.neutral[300]} name="Neutral 300 (Gray)" hex={colors.neutral[300]} />
                  <ColorSwatch color={colors.neutral[500]} name="Neutral 500" hex={colors.neutral[500]} />
                  <ColorSwatch color={colors.neutral[700]} name="Neutral 700" hex={colors.neutral[700]} />
                  <ColorSwatch color={colors.neutral[900]} name="Neutral 900" hex={colors.neutral[900]} />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">功能色 (Functional)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <ColorSwatch color={colors.error[500]} name="Error" hex={colors.error[500]} />
                  <ColorSwatch color={colors.warning[500]} name="Warning" hex={colors.warning[500]} />
                  <ColorSwatch color={colors.landscape.mountain} name="Mountain" hex={colors.landscape.mountain} />
                  <ColorSwatch color={colors.landscape.water} name="Water" hex={colors.landscape.water} />
                </div>
              </section>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-12 animate-fade-in">
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">字体家族</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-white/50 rounded-lg border border-[#D3D3D3]">
                    <p className="text-sm text-gray-500 mb-2">Serif (标题/正文)</p>
                    <p className="text-2xl font-serif">富春山居图 - Dwelling in the Fuchun Mountains</p>
                    <p className="text-base font-serif mt-2">天地有大美而不言，四时有明法而不议，万物有成理而不说。</p>
                  </div>
                  <div className="p-4 bg-white/50 rounded-lg border border-[#D3D3D3]">
                    <p className="text-sm text-gray-500 mb-2">Sans (UI元素)</p>
                    <p className="text-2xl font-sans">用户界面设计 - User Interface Design</p>
                    <p className="text-base font-sans mt-2">清晰的层级结构，直观的交互体验，优雅的视觉呈现。</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">字体层级</h2>
                <div className="space-y-6 p-6 bg-white/50 rounded-xl border border-[#D3D3D3]">
                  <div>
                    <h1 className="text-5xl font-semibold">Display 5xl</h1>
                    <p className="text-sm text-gray-500">3rem (48px) - 页面主标题</p>
                  </div>
                  <div>
                    <h2 className="text-4xl font-semibold">Heading 4xl</h2>
                    <p className="text-sm text-gray-500">2.25rem (36px) - 章节标题</p>
                  </div>
                  <div>
                    <h3 className="text-3xl font-semibold">Heading 3xl</h3>
                    <p className="text-sm text-gray-500">1.875rem (30px) - 区块标题</p>
                  </div>
                  <div>
                    <h4 className="text-2xl font-semibold">Heading 2xl</h4>
                    <p className="text-sm text-gray-500">1.5rem (24px) - 子标题</p>
                  </div>
                  <div>
                    <p className="text-xl">Body Large</p>
                    <p className="text-sm text-gray-500">1.25rem (20px) - 强调正文</p>
                  </div>
                  <div>
                    <p className="text-base">Body Base</p>
                    <p className="text-sm text-gray-500">1rem (16px) - 默认正文</p>
                  </div>
                  <div>
                    <p className="text-sm">Body Small</p>
                    <p className="text-sm text-gray-500">0.875rem (14px) - 辅助文本</p>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'components' && (
            <div className="space-y-12 animate-fade-in">
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">按钮 (Buttons)</h2>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                </div>
                <div className="flex flex-wrap gap-4 mb-6 items-center">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
                <div className="flex flex-wrap gap-4 mb-6">
                  <Button leftIcon={<Icons.CheckIcon />}>Left Icon</Button>
                  <Button rightIcon={<Icons.ArrowRightIcon />}>Right Icon</Button>
                  <Button isLoading>Loading</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">输入框 (Inputs)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <Input label="用户名" placeholder="请输入用户名" />
                  <Input label="密码" type="password" placeholder="请输入密码" />
                  <Input label="带图标" icon={Icons.SearchIcon} placeholder="搜索..." />
                  <Input label="错误状态" error="输入内容无效" defaultValue="无效内容" />
                  <Input label="禁用状态" disabled defaultValue="无法编辑" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">徽章 (Badges)</h2>
                <div className="flex flex-wrap gap-4">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="info">Info</Badge>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">卡片 (Cards)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold">基础卡片</h3>
                    </CardHeader>
                    <CardBody>
                      <p>这是卡片的基础样式，包含了标题和内容区域。背景色为米色，带有轻微的阴影。</p>
                    </CardBody>
                    <CardFooter>
                      <Button size="sm" variant="outline">操作按钮</Button>
                    </CardFooter>
                  </Card>
                  
                  <Card hover>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold">带图标和悬停效果</h3>
                        <Icons.MountainIcon />
                      </div>
                    </CardHeader>
                    <CardBody>
                      <p>将鼠标悬停在卡片上可以看到上浮和阴影加深的效果。右上角有一个手绘山水图标。</p>
                    </CardBody>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">头像 (Avatars)</h2>
                <div className="flex gap-4 items-center">
                  <Avatar size="sm" name="User" />
                  <Avatar size="md" name="Admin" />
                  <Avatar size="lg" name="Guest" />
                  <Avatar size="xl" name="Master" />
                  <Avatar size="md" />
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">交互反馈</h2>
                <div className="flex flex-wrap gap-4">
                  <Button onClick={() => showToast('success')} variant="outline">显示成功提示</Button>
                  <Button onClick={() => showToast('error')} variant="outline">显示错误提示</Button>
                  <Button onClick={() => showToast('warning')} variant="outline">显示警告提示</Button>
                  <Button onClick={() => setIsModalOpen(true)}>打开模态框</Button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'icons' && (
            <div className="space-y-12 animate-fade-in">
              <section>
                <h2 className="text-2xl font-semibold mb-6 text-[#1A4A0A]">手绘图标库</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {Object.entries(Icons).map(([name, IconComponent]) => {
                     // Skip if not a component (though all exports should be components or types)
                     if (typeof IconComponent !== 'function') return null;
                     
                     return (
                      <div key={name} className="flex flex-col items-center p-4 bg-white/50 rounded-xl border border-[#D3D3D3] hover:shadow-md transition-shadow">
                        <div className="text-[#6BA539] mb-3">
                          {/* @ts-ignore - Icon component usage */}
                          <IconComponent size="lg" />
                        </div>
                        <span className="text-xs text-gray-600 font-mono text-center break-all">{name}</span>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </CloudMountainBackground>
  )
}
