/**
 * Tabs 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 选项卡切换
 * - 受控/非受控模式
 * - 禁用状态
 * - 内容显示
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

describe('Tabs - 基础渲染', () => {
  it('渲染Tabs组件', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })

  it('使用默认值选中第一个选项卡', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('内容1')).toBeInTheDocument()
    expect(screen.queryByText('内容2')).not.toBeInTheDocument()
  })
})

describe('Tabs - 选项卡切换', () => {
  it('点击选项卡切换内容', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByRole('tab', { name: '选项卡2' })
    await user.click(tab2)

    expect(screen.getByText('内容2')).toBeInTheDocument()
    expect(screen.queryByText('内容1')).not.toBeInTheDocument()
  })

  it('触发onValueChange回调', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <Tabs defaultValue="tab1" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByRole('tab', { name: '选项卡2' })
    await user.click(tab2)

    expect(handleChange).toHaveBeenCalledWith('tab2')
  })
})

describe('Tabs - 受控模式', () => {
  it('使用受控值', () => {
    const { rerender } = render(
      <Tabs value="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('内容1')).toBeInTheDocument()

    rerender(
      <Tabs value="tab2">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('内容2')).toBeInTheDocument()
  })
})

describe('Tabs - 禁用状态', () => {
  it('禁用选项卡无法点击', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(
      <Tabs defaultValue="tab1" onValueChange={handleChange}>
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByRole('tab', { name: '选项卡2' })
    await user.click(tab2)

    expect(handleChange).not.toHaveBeenCalled()
    expect(screen.getByText('内容1')).toBeInTheDocument()
  })
})

describe('Tabs - 可访问性', () => {
  it('有正确的role属性', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.getByRole('tab')).toBeInTheDocument()
  })

  it('选中选项卡有aria-selected=true', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('禁用选项卡有aria-disabled=true', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2" disabled>选项卡2</TabsTrigger>
        </TabsList>
      </Tabs>
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs[1]).toHaveAttribute('aria-disabled', 'true')
  })

  it('内容面板有role="tabpanel"', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
      </Tabs>
    )

    expect(screen.getByRole('tabpanel')).toBeInTheDocument()
  })
})

describe('Tabs - 内容显示', () => {
  it('只显示选中选项卡的内容', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
          <TabsTrigger value="tab3">选项卡3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
        <TabsContent value="tab3">内容3</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('内容1')).toBeInTheDocument()
    expect(screen.queryByText('内容2')).not.toBeInTheDocument()
    expect(screen.queryByText('内容3')).not.toBeInTheDocument()
  })

  it('切换选项卡时正确显示内容', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">选项卡1</TabsTrigger>
          <TabsTrigger value="tab2">选项卡2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">内容1</TabsContent>
        <TabsContent value="tab2">内容2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('内容1')).toBeInTheDocument()

    const tab2 = screen.getByRole('tab', { name: '选项卡2' })
    await user.click(tab2)

    expect(screen.getByText('内容2')).toBeInTheDocument()
    expect(screen.queryByText('内容1')).not.toBeInTheDocument()
  })
})
