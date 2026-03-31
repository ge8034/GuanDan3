#!/usr/bin/env node
/**
 * 重新执行失败的迁移
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

// 改进的SQL分割函数
function splitSQL(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let i = 0;

  while (i < sql.length) {
    if (sql.substr(i, 2) === '$$') {
      inDollarQuote = !inDollarQuote;
      current += '$$';
      i += 2;
    } else if (sql[i] === ';' && !inDollarQuote) {
      current += ';';
      if (current.trim() && !current.trim().startsWith('--')) {
        statements.push(current.trim());
      }
      current = '';
      i++;
    } else {
      current += sql[i];
      i++;
    }
  }

  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

// 要执行的迁移文件
const NEW_MIGRATIONS = [
  { file: '20260330000003_fix_start_game_initialize_private_hands.sql', desc: '修复 start_game 函数初始化' },
  { file: '20260331000001_add_move_validation.sql', desc: '添加掼蛋牌型验证' },
  { file: '20260331000002_add_validation_to_submit_turn.sql', desc: '在 submit_turn 中集成验证' },
  { file: '20260331000003_add_level_rank_column.sql', desc: '添加 level_rank 列' },
  { file: '20260331000004_fix_level_rank_default.sql', desc: '修复 level_rank 默认值' },
];

// 执行单个迁移文件
async function executeSingleMigration(client, migration) {
  const startTime = Date.now();

  try {
    await client.query('BEGIN');

    const sql = fs.readFileSync(migration.path, 'utf8');
    const statements = splitSQL(sql);

    console.log(`   解析到 ${statements.length} 个 SQL 语句`);

    for (const statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }

    const executionTime = Date.now() - startTime;
    await client.query('COMMIT');

    return { success: true, executionTime };
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {}
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  console.log('=================================================');
  console.log('  重新执行迁移');
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
      // 清理失败的迁移记录
      console.log('🧹 清理失败的迁移记录...\n');
      await client.query("DELETE FROM schema_migrations WHERE success = false AND version LIKE '202603%'");
      console.log('✅ 清理完成\n');

      // 检查当前状态
      const result = await client.query(
        "SELECT version, name, success FROM schema_migrations WHERE version LIKE '202603%' ORDER BY version"
      );

      const appliedVersions = new Set(
        result.rows.filter(r => r.success).map(r => r.version)
      );

      console.log(`📋 当前已应用的迁移: ${appliedVersions.size} 个\n`);

      // 执行未应用的迁移
      let successCount = 0;
      let failCount = 0;

      for (const migration of NEW_MIGRATIONS) {
        const version = migration.file.split('_')[0];
        const migrationPath = path.join(migrationsDir, migration.file);

        if (appliedVersions.has(version)) {
          console.log(`⏭️  跳过: ${version} - ${migration.desc}\n`);
          continue;
        }

        console.log(`-------------------------------------------------`);
        console.log(`执行: ${version} - ${migration.desc}`);
        console.log(`-------------------------------------------------`);

        const result = await executeSingleMigration(client, {
          file: migration.file,
          path: migrationPath
        });

        if (result.success) {
          // 记录成功
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
             VALUES ($1, $2, NOW(), '', $3, true, 'development')`,
            [version, migration.desc, result.executionTime]
          );

          console.log(`✅ 成功 (${result.executionTime}ms)\n`);
          successCount++;
          appliedVersions.add(version);
        } else {
          console.error(`❌ 失败: ${result.error}\n`);
          failCount++;
        }
      }

      console.log('=================================================');
      console.log(`  执行完成: ${successCount} 成功, ${failCount} 失败`);
      console.log('=================================================\n');

      // 最终状态
      const finalResult = await client.query(
        "SELECT version, name, success FROM schema_migrations WHERE version LIKE '202603%' ORDER BY version"
      );

      console.log('📋 迁移状态:');
      finalResult.rows.forEach(m => {
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
