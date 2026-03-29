/**
 * 认证相关的API mock设置
 */

import type { Page } from '@playwright/test'
import { createMockToken, createMockUser } from '../helpers'

/**
 * 设置认证相关的API mock
 */
export async function setupAuthMocks(page: Page, userId: string = 'mock-user-id'): Promise<void> {
  const validToken = createMockToken(userId)
  const user = createMockUser(userId)

  // Mock signInAnonymously
  await page.route('**/auth/v1/anonymous', async route => {
    console.log('Mocking Auth Anonymous Sign In')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: validToken,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user,
        session: {
          access_token: validToken,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user
        }
      })
    })
  })

  // Mock getSession
  await page.route('**/auth/v1/session', async route => {
    console.log('Mocking Auth Get Session')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        session: {
          access_token: validToken,
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user
        }
      })
    })
  })

  // Mock getUser
  await page.route('**/auth/v1/user', async route => {
    console.log('Mocking Auth User')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user })
    })
  })

  // Mock signup (for compatibility)
  await page.route('**/auth/v1/signup', async route => {
    console.log('Mocking Auth Signup')

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: validToken,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user
      })
    })
  })
}
