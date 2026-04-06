/**
 * AI 系统管理器测试 - 覆盖率提升
 * 测试 AISystemManager 单例模式和内存管理
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager'
import { devLog } from '@/lib/utils/devLog'

// Mock devLog
vi.mock('@/lib/utils/devLog', () => ({
  devLog: vi.fn(),
}))

describe('AISystemManager - 单例模式', () => {
  it('导出的 aiSystemManager 应该是单例', () => {
    const instance1 = aiSystemManager
    const instance2 = aiSystemManager

    expect(instance1).toBe(instance2)
  })
})

describe('AISystemManager - 系统创建和获取', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该创建新系统', () => {
    const system = aiSystemManager.getOrCreateSystem('room-123', 'medium')

    expect(system).toBeDefined()
    expect(system.roomId).toBe('room-123')
    expect(system.difficulty).toBe('medium')
    expect(system.teamManager).toBeDefined()
    expect(system.dispatcher).toBeDefined()
    expect(system.planner).toBeDefined()
    expect(system.createdAt).toBeGreaterThan(0)
  })

  it('应该返回已存在的系统', () => {
    const system1 = aiSystemManager.getOrCreateSystem('room-123', 'easy')
    const system2 = aiSystemManager.getOrCreateSystem('room-123', 'easy')

    expect(system1).toBe(system2)
  })

  it('应该在难度改变时重建系统', () => {
    const system1 = aiSystemManager.getOrCreateSystem('room-123', 'easy')
    const system2 = aiSystemManager.getOrCreateSystem('room-123', 'hard')

    expect(system1).not.toBe(system2)
    expect(system2.difficulty).toBe('hard')
  })

  it('应该正确设置难度', () => {
    const easySystem = aiSystemManager.getOrCreateSystem('room-1', 'easy')
    const mediumSystem = aiSystemManager.getOrCreateSystem('room-2', 'medium')
    const hardSystem = aiSystemManager.getOrCreateSystem('room-3', 'hard')

    expect(easySystem.difficulty).toBe('easy')
    expect(mediumSystem.difficulty).toBe('medium')
    expect(hardSystem.difficulty).toBe('hard')
  })

  it('应该能够获取现有系统', () => {
    const system1 = aiSystemManager.getOrCreateSystem('room-123', 'medium')
    const system2 = aiSystemManager.getSystem('room-123')

    expect(system1).toBe(system2)
  })

  it('应该对不存在的系统返回 undefined', () => {
    const system = aiSystemManager.getSystem('non-existent-room')
    expect(system).toBeUndefined()
  })
})

describe('AISystemManager - 系统销毁', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  it('应该销毁指定系统', () => {
    aiSystemManager.getOrCreateSystem('room-123', 'medium')
    expect(aiSystemManager.getSystem('room-123')).toBeDefined()

    aiSystemManager.disposeSystem('room-123')
    expect(aiSystemManager.getSystem('room-123')).toBeUndefined()
  })

  it('应该销毁所有系统', () => {
    aiSystemManager.getOrCreateSystem('room-1', 'easy')
    aiSystemManager.getOrCreateSystem('room-2', 'medium')
    aiSystemManager.getOrCreateSystem('room-3', 'hard')

    expect(aiSystemManager.getActiveRoomIds().length).toBe(3)

    aiSystemManager.disposeAll()

    expect(aiSystemManager.getActiveRoomIds().length).toBe(0)
  })

  it('销毁不存在的系统不应该报错', () => {
    expect(() => aiSystemManager.disposeSystem('non-existent-room')).not.toThrow()
  })
})

describe('AISystemManager - 内存管理', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该清理过期系统（默认30分钟）', () => {
    // 创建一个旧系统
    const oldSystem = aiSystemManager.getOrCreateSystem('old-room', 'easy')
    // 手动设置创建时间为31分钟前
    Object.defineProperty(oldSystem, 'createdAt', {
      value: Date.now() - 31 * 60 * 1000,
      writable: true,
    })

    // 创建一个新系统
    aiSystemManager.getOrCreateSystem('new-room', 'easy')

    aiSystemManager.disposeStaleSystems()

    expect(aiSystemManager.getSystem('old-room')).toBeUndefined()
    expect(aiSystemManager.getSystem('new-room')).toBeDefined()
  })

  it('应该清理过期系统（自定义时间）', () => {
    const oldSystem = aiSystemManager.getOrCreateSystem('old-room', 'easy')
    Object.defineProperty(oldSystem, 'createdAt', {
      value: Date.now() - 5 * 60 * 1000, // 5分钟前
      writable: true,
    })

    aiSystemManager.getOrCreateSystem('new-room', 'easy')

    // 使用1分钟的过期时间
    aiSystemManager.disposeStaleSystems(60 * 1000)

    expect(aiSystemManager.getSystem('old-room')).toBeUndefined()
    expect(aiSystemManager.getSystem('new-room')).toBeDefined()
  })

  it('应该保留未过期的系统', () => {
    aiSystemManager.getOrCreateSystem('room-1', 'easy')
    aiSystemManager.getOrCreateSystem('room-2', 'medium')

    aiSystemManager.disposeStaleSystems(60 * 1000)

    expect(aiSystemManager.getActiveRoomIds().length).toBe(2)
  })

  it('应该启动定期清理', () => {
    const oldSystem = aiSystemManager.getOrCreateSystem('old-room', 'easy')
    Object.defineProperty(oldSystem, 'createdAt', {
      value: Date.now() - 31 * 60 * 1000,
      writable: true,
    })

    const cleanup = aiSystemManager.startPeriodicCleanup(100) // 100ms间隔

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(aiSystemManager.getSystem('old-room')).toBeUndefined()
        cleanup() // 停止清理
        resolve()
      }, 150)
    })
  })

  it('应该能够停止定期清理', () => {
    const cleanup = aiSystemManager.startPeriodicCleanup(100)

    // 停止清理不应该报错
    expect(() => cleanup()).not.toThrow()
  })
})

describe('AISystemManager - 活跃房间查询', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该返回所有活跃房间ID', () => {
    aiSystemManager.getOrCreateSystem('room-1', 'easy')
    aiSystemManager.getOrCreateSystem('room-2', 'medium')
    aiSystemManager.getOrCreateSystem('room-3', 'hard')

    const activeRooms = aiSystemManager.getActiveRoomIds()

    expect(activeRooms).toHaveLength(3)
    expect(activeRooms).toContain('room-1')
    expect(activeRooms).toContain('room-2')
    expect(activeRooms).toContain('room-3')
  })

  it('空时应该返回空数组', () => {
    const activeRooms = aiSystemManager.getActiveRoomIds()
    expect(activeRooms).toEqual([])
  })

  it('应该反映系统销毁后的状态', () => {
    aiSystemManager.getOrCreateSystem('room-1', 'easy')
    aiSystemManager.getOrCreateSystem('room-2', 'medium')

    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(2)

    aiSystemManager.disposeSystem('room-1')

    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(1)
    expect(aiSystemManager.getActiveRoomIds()).toContain('room-2')
  })
})

describe('AISystemManager - 并发安全性', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
    vi.clearAllMocks()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该处理并发创建请求', () => {
    const systems = Array.from({ length: 10 }, (_, i) =>
      aiSystemManager.getOrCreateSystem(`room-${i}`, 'easy')
    )

    expect(systems).toHaveLength(10)
    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(10)

    // 每个系统应该是唯一的
    const uniqueSystems = new Set(systems)
    expect(uniqueSystems.size).toBe(10)
  })

  it('应该处理重复创建相同房间', () => {
    const system1 = aiSystemManager.getOrCreateSystem('room-123', 'easy')
    const system2 = aiSystemManager.getOrCreateSystem('room-123', 'easy')
    const system3 = aiSystemManager.getOrCreateSystem('room-123', 'easy')

    expect(system1).toBe(system2)
    expect(system2).toBe(system3)
    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(1)
  })
})

describe('AISystemManager - 边界条件', () => {
  beforeEach(() => {
    aiSystemManager.disposeAll()
  })

  afterEach(() => {
    aiSystemManager.disposeAll()
  })

  it('应该处理空字符串房间ID', () => {
    const system = aiSystemManager.getOrCreateSystem('', 'easy')
    expect(system).toBeDefined()
    expect(system.roomId).toBe('')
  })

  it('应该处理特殊字符房间ID', () => {
    const specialIds = [
      'room-with-123-numbers',
      'room_with_underscores',
      'room.with.dots',
      'room/with/slashes',
      'room:with:colons',
    ]

    specialIds.forEach((id) => {
      const system = aiSystemManager.getOrCreateSystem(id, 'medium')
      expect(system.roomId).toBe(id)
    })
  })

  it('应该处理大量房间', () => {
    const roomCount = 100
    for (let i = 0; i < roomCount; i++) {
      aiSystemManager.getOrCreateSystem(`room-${i}`, 'easy')
    }

    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(roomCount)
  })

  it('应该处理快速创建和销毁', () => {
    for (let i = 0; i < 50; i++) {
      aiSystemManager.getOrCreateSystem(`room-${i}`, 'easy')
    }

    for (let i = 0; i < 50; i += 2) {
      aiSystemManager.disposeSystem(`room-${i}`)
    }

    expect(aiSystemManager.getActiveRoomIds()).toHaveLength(25)
  })
})
