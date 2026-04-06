// 应用Supabase迁移的脚本
const migrations = [
  'supabase/migrations/20260331000005_fix_validation_consistency.sql',
  'supabase/migrations/20260401000002_fix_validation_with_complete_rules.sql'
];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // 需要service_role权限

console.log('请手动在Supabase SQL Editor中执行以下迁移文件：');
migrations.forEach((file, index) => {
  console.log(`\n${index + 1}. ${file}`);
});
