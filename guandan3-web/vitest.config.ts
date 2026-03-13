/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/game/**/*.{ts,tsx}', 'src/lib/store/**/*.{ts,tsx}'],
      exclude: ['src/test/**/*', 'src/**/*.d.ts', 'src/app/**/*', 'src/lib/supabase/**/*', 'src/lib/hooks/**/*'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
