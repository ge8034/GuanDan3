/**
 * 直接修复games表缺失列的脚本
 * 使用PostgreSQL连接直接执行SQL
 */

const { Client } = require('pg');

// 从环境变量获取数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres';

async function fixGamesTable() {
  const client = new Client(DATABASE_URL);

  try {
    await client.connect();
    console.log('🔗 已连接到数据库');

    // 检查列是否存在
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'games'
      AND column_name IN ('paused_by', 'paused_at', 'pause_reason')
    `);

    const existingColumns = checkResult.rows.map(row => row.column_name);
    console.log('当前存在的列:', existingColumns);

    // 添加缺失的列
    const columnsToAdd = [
      { name: 'paused_by', sql: 'ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_by uuid;' },
      { name: 'paused_at', sql: 'ALTER TABLE games ADD COLUMN IF NOT EXISTS paused_at timestamptz;' },
      { name: 'pause_reason', sql: 'ALTER TABLE games ADD COLUMN IF NOT EXISTS pause_reason text;' }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`➕ 添加列: ${col.name}`);
        await client.query(col.sql);
      } else {
        console.log(`✅ 列已存在: ${col.name}`);
      }
    }

    // 验证结果
    const verifyResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'games'
      AND column_name IN ('paused_by', 'paused_at', 'pause_reason')
      ORDER BY column_name
    `);

    console.log('\n✅ 修复完成！games表现在有这些列:');
    verifyResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixGamesTable();
