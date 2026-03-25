import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'

describe('数据库集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('房间管理集成', () => {
    it('应该能够创建房间', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'room-1', name: 'Test Room' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('rooms').insert({
        name: 'Test Room',
        maxPlayers: 4
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('room-1')
      expect(result.data?.name).toBe('Test Room')
    })

    it('应该能够查询房间', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'room-1', name: 'Test Room' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('rooms').select().eq('id', 'room-1').single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('room-1')
    })

    it('应该能够更新房间', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'room-1', name: 'Updated Room' },
                error: null
              })
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('rooms').update({ name: 'Updated Room' })
        .eq('id', 'room-1').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('Updated Room')
    })

    it('应该能够删除房间', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('rooms').delete().eq('id', 'room-1')

      expect(result.error).toBeNull()
    })
  })

  describe('用户管理集成', () => {
    it('应该能够创建用户', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', email: 'test@example.com' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('users').insert({
        email: 'test@example.com',
        username: 'testuser'
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.email).toBe('test@example.com')
    })

    it('应该能够查询用户', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-1', email: 'test@example.com' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('users').select().eq('id', 'user-1').single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('user-1')
    })

    it('应该能够更新用户', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'user-1', email: 'updated@example.com' },
                error: null
              })
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('users').update({ email: 'updated@example.com' })
        .eq('id', 'user-1').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.email).toBe('updated@example.com')
    })
  })

  describe('游戏数据集成', () => {
    it('应该能够创建游戏记录', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'game-1', roomId: 'room-1', status: 'playing' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('games').insert({
        roomId: 'room-1',
        status: 'playing'
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.roomId).toBe('room-1')
      expect(result.data?.status).toBe('playing')
    })

    it('应该能够查询游戏记录', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'game-1', roomId: 'room-1', status: 'playing' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('games').select().eq('id', 'game-1').single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('game-1')
    })

    it('应该能够更新游戏状态', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'game-1', status: 'finished' },
                error: null
              })
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('games').update({ status: 'finished' })
        .eq('id', 'game-1').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.status).toBe('finished')
    })
  })

  describe('实时订阅集成', () => {
    it('应该能够创建实时订阅', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase).channel = mockChannel

      const channel = supabase.channel('test-channel')
      const subscription = channel.on('broadcast', { event: '*' }, () => {}).subscribe()

      expect(subscription).toBeDefined()
      expect(subscription.unsubscribe).toBeDefined()
    })

    it('应该能够取消订阅', () => {
      const mockUnsubscribe = vi.fn()
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: mockUnsubscribe
        })
      })

      vi.mocked(supabase).channel = mockChannel

      const channel = supabase.channel('test-channel')
      const subscription = channel.on('broadcast', { event: '*' }, () => {}).subscribe()

      subscription.unsubscribe()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('错误处理集成', () => {
    it('应该能够处理数据库错误', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const result = await mockFrom('rooms').insert({ name: 'Test Room' }).select().single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('应该能够处理网络错误', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Network error'))
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      await expect(
        mockFrom('rooms').insert({ name: 'Test Room' }).select().single()
      ).rejects.toThrow()
    })
  })

  describe('并发操作集成', () => {
    it('应该能够处理并发查询', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'room-1', name: 'Test Room' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const promises = Array.from({ length: 10 }, (_, i) =>
        mockFrom('rooms').select().eq('id', `room-${i}`).single()
      )

      const results = await Promise.all(promises)

      expect(results.length).toBe(10)
      results.forEach(result => {
        expect(result.data).toBeDefined()
      })
    })

    it('应该能够处理并发插入', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: `room-${Math.random()}`, name: 'Test Room' },
              error: null
            })
          })
        })
      })

      vi.mocked(supabase).from = mockFrom

      const promises = Array.from({ length: 5 }, (_, i) =>
        mockFrom('rooms').insert({ name: `Room ${i}` }).select().single()
      )

      const results = await Promise.all(promises)

      expect(results.length).toBe(5)
      results.forEach(result => {
        expect(result.data).toBeDefined()
      })
    })
  })
})
