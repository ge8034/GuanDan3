#!/usr/bin/env node
/**
 * 检查数据库中的函数状态
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function parseEnvFile(filePath) {
  const env = {};
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
  console.log('  检查数据库函数状态');
  console.log('=================================================\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();

    try {
      // 检查所有 validate 相关的函数
      console.log('📋 查找所有 validate 相关的函数:\n');
      const result = await client.query(`
        SELECT routine_name, routine_type
        FROM information_schema.routines
        WHERE routine_schema = 'public'
          AND (routine_name LIKE '%validate%' OR routine_name LIKE '%guandan%')
        ORDER BY routine_name
      `);

      if (result.rows.length === 0) {
        console.log('❌ 没有找到任何 validate 相关的函数\n');
        console.log('💡 这意味着函数创建 SQL 可能没有成功执行\n');

        // 显示所有函数
        const allFunctions = await client.query(`
          SELECT routine_name
          FROM information_schema.routines
          WHERE routine_schema = 'public'
          ORDER BY routine_name
          LIMIT 20
        `);

        console.log('📋 当前数据库中的函数（前20个）:');
        allFunctions.rows.forEach(r => {
          console.log(`  - ${r.routine_name}`);
        });
        console.log();

      } else {
        console.log('✅ 找到以下函数:\n');
        result.rows.forEach(r => {
          console.log(`  ${r.routine_name} (${r.routine_type})`);
        });
        console.log();
      }

      // 尝试直接创建函数
      console.log('-------------------------------------------------');
      console.log('尝试创建 validate_guandan_move 函数');
      console.log('-------------------------------------------------\n');

      const sql = fs.readFileSync(
        path.join(process.cwd(), 'supabase/migrations/20260331000001_add_move_validation_fixed.sql'),
        'utf8'
      );

      try {
        await client.query(sql);
        console.log('✅ 函数创建成功！\n');

        // 再次检查
        const checkResult = await client.query(`
          SELECT routine_name
          FROM information_schema.routines
          WHERE routine_schema = 'public'
            AND routine_name = 'validate_guandan_move'
        `);

        if (checkResult.rows.length > 0) {
          console.log('📋 函数信息:');
          console.log(`  名称: ${checkResult.rows[0].routine_name}`);
          console.log(`  状态: 已创建\n`);
        }

      } catch (error) {
        console.error('❌ 函数创建失败:');
        console.error(`   ${error.message}\n`);
      }

    } finally {
      client.release();
    }

  } finally {
    await pool.end();
  }
}

main().then(() => {
  console.log('=================================================');
  console.log('  完成！');
  console.log('=================================================\n');
  process.exit(0);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
