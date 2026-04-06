const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('✓ 已连接到数据库');

    // 读取迁移文件
    const migrationFiles = [
      'supabase/migrations/20260331000005_fix_state_private_hands_structure.sql',
      'supabase/migrations/20260331000006_fix_get_ai_hand_structure.sql'
    ];

    for (const file of migrationFiles) {
      console.log(`\n应用迁移: ${file}`);
      const sql = fs.readFileSync(file, 'utf8');
      
      await client.query(sql);
      console.log(`✓ ${file} 应用成功`);
    }

    console.log('\n✓ 所有迁移应用成功');
  } catch (error) {
    console.error('✗ 迁移失败:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
