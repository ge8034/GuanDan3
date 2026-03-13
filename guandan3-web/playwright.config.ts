import { defineConfig, devices } from '@playwright/test';

const hasSupabaseEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: hasSupabaseEnv ? undefined : ['**/noop.spec.ts'],
  // Global timeout for the entire test run (10 minutes)
  globalTimeout: 10 * 60 * 1000, 
  // Timeout for each individual test (2 minutes)
  timeout: 120 * 1000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'off' : 'retain-on-failure',
    // Action timeout (click, type, etc.)
    actionTimeout: 20000,
    // Navigation timeout
    navigationTimeout: 30000,
  },
  expect: {
    // Timeout for expect() assertions
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: process.platform === 'win32' ? 'msedge' : undefined },
    },
  ],
  webServer: hasSupabaseEnv ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  } : undefined,
});
