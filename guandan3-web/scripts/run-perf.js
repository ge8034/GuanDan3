const { spawnSync } = require('node:child_process')

const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!hasEnv) {
  process.stdout.write('缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY，跳过性能基线用例。\n')
  process.exit(0)
}

const res = spawnSync('npx', ['playwright', 'test', 'tests/e2e/perf-baseline.spec.ts'], {
  stdio: 'inherit',
  shell: true,
})

process.exit(res.status ?? 1)

