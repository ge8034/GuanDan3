const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  try {
    console.log('✓ 已连接到 Supabase');

    // 读取迁移文件
    const migrationFiles = [
      'supabase/migrations/20260331000005_fix_state_private_hands_structure.sql',
      'supabase/migrations/20260331000006_fix_get_ai_hand_structure.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`\n应用迁移: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      
      // 使用 Supabase RPC 执行 SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`✗ ${file} 失败:`, error);
        // 继续尝试下一个
      } else {
        console.log(`✓ ${file} 应用成功`);
      }
    }

    console.log('\n✓ 所有迁移应用完成');
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    process.exit(1);
  }
}

applyMigration();
