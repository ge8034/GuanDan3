#!/usr/bin/env node
/**
 * 执行剩余的迁移（简化版 - 直接执行整个文件）
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 解析 .env.local 文件
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
  console.log('  执行剩余迁移');
  console.log('=================================================\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 未配置');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');

    try {
      // 执行剩余的迁移文件
      const remainingFile = '20260331000001_add_move_validation.sql';
      const version = '20260331000001';
      const migrationPath = path.join(migrationsDir, remainingFile);

      console.log(`-------------------------------------------------`);
      console.log(`执行: ${remainingFile}`);
      console.log(`-------------------------------------------------`);

      const startTime = Date.now();

      try {
        // 读取整个SQL文件
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // 直接执行整个文件
        await client.query(sql);

        const executionTime = Date.now() - startTime;

        // 记录成功
        await client.query(
          `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
           VALUES ($1, $2, NOW(), '', $3, true, 'development')
           ON CONFLICT (version) DO UPDATE SET success = true, execution_time = $3`,
          [version, '添加掼蛋牌型验证', executionTime]
        );

        console.log(`✅ 成功 (${executionTime}ms)\n`);

      } catch (error) {
        console.error(`❌ 失败: ${error.message}\n`);
        console.log('尝试使用 Supabase Dashboard 手动执行此文件...\n');

        // 输出文件内容供手动复制
        console.log('=================================================');
        console.log('  SQL 文件内容（可复制到 Supabase Dashboard）');
        console.log('=================================================\n');
        console.log(fs.readFileSync(migrationPath, 'utf8'));
        console.log('\n=================================================\n');
      }

      // 显示最终状态
      const result = await client.query(
        "SELECT version, name, success FROM schema_migrations WHERE version LIKE '202603%' ORDER BY version"
      );

      console.log('📋 迁移状态:');
      result.rows.forEach(m => {
        const status = m.success ? '✅' : '❌';
        console.log(`  ${status} ${m.version} - ${m.name}`);
      });
      console.log();

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
