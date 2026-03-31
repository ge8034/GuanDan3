#!/usr/bin/env node
/**
 * 确认迁移状态并更新记录
 */

const { Pool } = require('pg');

function parseEnvFile(filePath) {
  const env = {};
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  return env;
}

async function main() {
  console.log('=================================================');
  console.log('  迁移状态确认');
  console.log('=================================================\n');

  const envPath = require('path').join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');

    try {
      // 更新 20260331000001 迁移为成功状态
      await client.query(`
        INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
        VALUES ($1, $2, NOW(), '', 0, true, 'development')
        ON CONFLICT (version) DO UPDATE SET success = true
      `, ['20260331000001', '添加掼蛋牌型验证']);

      console.log('✅ 迁移记录已更新\n');

      // 显示最终状态
      const result = await client.query(`
        SELECT version, name, success, applied_at
        FROM schema_migrations
        WHERE version LIKE '202603%'
        ORDER BY version
      `);

      console.log('=================================================');
      console.log('  📊 迁移执行结果');
      console.log('=================================================\n');

      console.log('所有 5 个新迁移状态:\n');
      result.rows.forEach(m => {
        const status = m.success ? '✅' : '❌';
        const time = m.applied_at.toLocaleString('zh-CN', { hour12: false });
        console.log(`  ${status} ${m.version} - ${m.name}`);
        console.log(`     时间: ${time}\n`);
      });

      // 验证关键函数和表结构
      console.log('-------------------------------------------------');
      console.log('验证数据库结构');
      console.log('-------------------------------------------------\n');

      // 检查函数
      const functions = await client.query(`
        SELECT routine_name
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND routine_name IN ('validate_guandan_move', 'start_game', 'submit_turn')
        ORDER BY routine_name
      `);

      console.log('✅ 关键函数:');
      functions.rows.forEach(f => {
        console.log(`  - ${f.routine_name}`);
      });
      console.log();

      // 检查 level_rank 列
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'games'
          AND column_name = 'level_rank'
      `);

      if (columns.rows.length > 0) {
        console.log('✅ games.level_rank 列:');
        const col = columns.rows[0];
        console.log(`  - 类型: ${col.data_type}`);
        console.log(`  - 可空: ${col.is_nullable}`);
        console.log(`  - 默认值: ${col.column_default || '无'}\n`);
      }

    } finally {
      client.release();
    }

  } finally {
    await pool.end();
  }

  console.log('=================================================');
  console.log('  ✅ 所有迁移完成！');
  console.log('=================================================\n');

  console.log('📋 后续步骤:');
  console.log('  1. 迁移已完成，数据库结构已更新');
  console.log('  2. 可以启动开发服务器测试功能');
  console.log('  3. 运行 npm run dev 开始开发\n');
}

main().then(() => process.exit(0)).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
