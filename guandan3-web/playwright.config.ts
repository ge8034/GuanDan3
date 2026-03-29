import { defineConfig, devices } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load .env.local manually if not in CI
if (!process.env.CI) {
  try {
    // use process.cwd() instead of __dirname
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('Loading env from:', envPath);
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    console.warn('Failed to load .env.local', e);
  }
}

// Force true for local testing since we know env is loaded by Next.js
const hasSupabaseEnv = true; // !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('Playwright Config: hasSupabaseEnv (Forced) =', hasSupabaseEnv);
if (!hasSupabaseEnv) {
  console.log('Missing env vars:', {
    url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

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
    baseURL: 'http://localhost:3001',
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
  // 禁用自动启动 webServer，假设开发服务器已经在运行
  // webServer: hasSupabaseEnv ? {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // } : undefined,
});
