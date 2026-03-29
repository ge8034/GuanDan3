/**
 * 聊天和其他API的mock设置
 */

import type { Page } from '@playwright/test'

/**
 * 设置聊天和其他API的mock
 */
export async function setupChatMocks(page: Page): Promise<void> {
  // GET /chat_messages - 获取聊天消息
  await page.route('**/rest/v1/chat_messages*', async route => {
    const url = route.request().url()

    if (route.request().method() === 'GET') {
      console.log('Mocking Get Chat Messages', url)

      if (url.includes('room_id=eq.')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        })
      }
    } else {
      await route.continue()
    }
  })

  // POST /chat_messages - 发送聊天消息
  await page.route('**/rest/v1/chat_messages', async route => {
    console.log('Mocking Post Chat Message')
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: 'msg-' + Date.now(),
        content: 'Test message',
        created_at: new Date().toISOString()
      }])
    })
  })
}
