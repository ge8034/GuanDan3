/**
 * 房间相关的API mock设置
 */

import type { Page } from '@playwright/test'
import type { MockRoom, MockRoomMember } from '../types'
import { generateMockId, getUrlParam, createPracticeRoomMembers, createPvpRoomMembers } from '../helpers'

/**
 * 设置房间相关的API mock
 */
export async function setupRoomMocks(page: Page, userId: string = 'mock-user-id'): Promise<void> {
  // 初始化全局房间存储
  if (!(global as any).mockRooms) {
    ;(global as any).mockRooms = []
  }

  // GET /rooms - 获取房间列表
  await page.route('**/rest/v1/rooms*', async route => {
    const url = route.request().url()

    if (route.request().method() === 'GET') {
      console.log('Mocking Get Rooms', url)

      // 检查是否是 .single() 查询
      // Supabase 的 .single() 会在 URL 中添加特定参数
      const isSingleQuery = url.includes('limit=1')

      // 按 ID 查询
      if (url.includes('id=eq.')) {
        const roomId = getUrlParam(url, 'id')
        // 去除 Supabase 过滤操作符前缀（如 eq.）
        const cleanRoomId = roomId?.replace(/^eq\./, '')
        const rooms = (global as any).mockRooms as MockRoom[]
        const room = rooms.find(r => r.id === cleanRoomId)

        console.log('[Get Rooms] URL:', url)
        console.log('[Get Rooms] Room found:', !!room, 'Room ID:', cleanRoomId)

        // 对于 ID 精确匹配查询（id=eq.xxx），返回单个对象
        // .single() 查期望直接返回单个对象
        if (!room) {
          console.log('[Get Rooms] No room found, returning null')
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: 'null'
          })
        } else {
          console.log('[Get Rooms] Returning single object with mode:', room.mode, 'owner_uid:', room.owner_uid)
          // 直接返回房间对象，Supabase .single() 不会包装它
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(room)
          })
        }
        return
      }

      // 按房间ID查询
      if (url.includes('room_id=eq.')) {
        const roomId = getUrlParam(url, 'room_id')
        const rooms = (global as any).mockRooms as MockRoom[]
        const room = rooms.find(r => r.id === roomId)

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(room ? [room] : [])
        })
        return
      }

      // 返回所有房间
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify((global as any).mockRooms || [])
      })
    } else if (route.request().method() === 'POST') {
      console.log('Mocking Create Room')
      const requestBody = route.request().postDataJSON()
      const mode = requestBody?.mode || 'pve1v3'
      const type = requestBody?.type || 'classic'
      const visibility = requestBody?.visibility || 'public'
      const name = requestBody?.name || 'Mock Room'
      const isPractice = mode === 'practice' || mode === 'pve1v3'

      const newRoom: MockRoom = {
        id: generateMockId('room'),
        name,
        mode: isPractice ? 'pve1v3' : (mode as any), // 修复：使用 'pve1v3' 以匹配 useAutoStart 的检查
        type,
        visibility,
        status: 'open',
        owner_uid: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 存储房间
      ;(global as any).mockRooms.push(newRoom)
      ;(global as any).isPracticeRoom = isPractice

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([newRoom])
      })
    } else {
      await route.continue()
    }
  })

  // RPC: join_room - 添加到房间成员列表
  await page.route('**/rest/v1/rpc/join_room', async route => {
    console.log('Mocking Join Room')
    const requestBody = route.request().postDataJSON()
    const roomId = requestBody?.p_room_id

    // 返回当前成员信息（包括新加入的成员）
    const isPractice = (global as any).isPracticeRoom
    const members = isPractice
      ? createPracticeRoomMembers(roomId, userId)
      : [...createPvpRoomMembers(roomId, userId)]

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(members)
    })
  })

  // GET /room_members - 获取房间成员
  await page.route('**/rest/v1/room_members*', async route => {
    const url = route.request().url()

    if (route.request().method() === 'GET') {
      console.log('Mocking Get Room Members', url)

      // 检查是否是练习房查询
      const isPracticeRoom = (global as any).isPracticeRoom
      const mockRooms = (global as any).mockRooms as any[] || []
      const currentRoom = mockRooms.length > 0 ? mockRooms[mockRooms.length - 1] : null

      if (url.includes('room_id=eq.')) {
        const roomId = getUrlParam(url, 'room_id')

        if (!roomId) {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Missing room_id' })
          })
          return
        }

        // 如果是练习房或者房间mode是pve1v3，返回练习房成员
        const isPracticeMode = isPracticeRoom || currentRoom?.mode === 'pve1v3'
        const members = isPracticeMode
          ? createPracticeRoomMembers(roomId, userId)
          : createPvpRoomMembers(roomId, userId)

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(members)
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: generateMockId('member'),
          room_id: getUrlParam(url, 'room_id'),
          seat_no: 1,
          uid: 'mock-user-id-2',
          member_type: 'human',
          ready: false,
          online: true
        }])
      })
    } else {
      await route.continue()
    }
  })
}
