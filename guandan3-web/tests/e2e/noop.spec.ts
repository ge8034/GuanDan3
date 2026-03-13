import { test } from '@playwright/test'

test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, '缺少 Supabase 环境变量，跳过 E2E 用例')

test('noop', async () => {})
