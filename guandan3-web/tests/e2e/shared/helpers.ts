/**
 * E2E测试共享工具函数
 */

import type { Page } from '@playwright/test'
import type { MockCard, MockAuthUser, MockGameHand, MockGame, MockRoom, MockRoomMember } from './types'
import { MOCK_HAND_CARDS } from './mock-data'
import { PLAYER_SEAT } from './types'

/**
 * 创建mock JWT token
 * @param userId - 用户ID
 * @param email - 测试邮箱
 * @returns 有效的JWT token字符串
 */
export function createMockToken(userId: string, email: string = process.env.TEST_MOCK_EMAIL || 'test@example.local'): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: userId,
    email,
    role: 'authenticated'
  })).toString('base64')
  const signature = 'mock-signature'
  return `${header}.${payload}.${signature}`
}

/**
 * 解析URL参数
 * @param url - 完整URL
 * @param param - 参数名
 * @returns 参数值或undefined
 */
export function getUrlParam(url: string, param: string): string | undefined {
  const pattern = new RegExp(`${param}=([^&]+)`)
  const match = url.match(pattern)
  return match ? match[1] : undefined
}

/**
 * 从全局状态获取mock手牌，如果不存在返回默认值
 */
export function getMockHandCards(): MockCard[] {
  return (global as any).mockHandCards || [...MOCK_HAND_CARDS]
}

/**
 * 设置全局mock手牌
 */
export function setMockHandCards(cards: MockCard[]): void {
  ;(global as any).mockHandCards = cards
}

/**
 * 生成唯一ID
 */
export function generateMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建mock用户对象
 */
export function createMockUser(userId: string): MockAuthUser {
  return {
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.local',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: new Date().toISOString()
  }
}

/**
 * 创建练习房间的成员列表
 */
export function createPracticeRoomMembers(roomId: string, userId: string): MockRoomMember[] {
  return [
    {
      id: `member-${roomId}-0`,
      room_id: roomId,
      seat_no: PLAYER_SEAT,
      uid: userId,
      member_type: 'human',
      ready: true,
      online: true
    },
    {
      id: `member-${roomId}-1`,
      room_id: roomId,
      seat_no: 1,
      uid: null,
      member_type: 'ai',
      ready: true,
      online: true,
      ai_key: 'ai-1'
    },
    {
      id: `member-${roomId}-2`,
      room_id: roomId,
      seat_no: 2,
      uid: null,
      member_type: 'ai',
      ready: true,
      online: true,
      ai_key: 'ai-2'
    },
    {
      id: `member-${roomId}-3`,
      room_id: roomId,
      seat_no: 3,
      uid: null,
      member_type: 'ai',
      ready: true,
      online: true,
      ai_key: 'ai-3'
    }
  ]
}

/**
 * 创建标准PvP房间的成员列表（仅房主）
 */
export function createPvpRoomMembers(roomId: string, userId: string): MockRoomMember[] {
  return [
    {
      id: `member-${roomId}-0`,
      room_id: roomId,
      seat_no: PLAYER_SEAT,
      uid: userId,
      member_type: 'human',
      ready: true,
      online: true
    }
  ]
}
