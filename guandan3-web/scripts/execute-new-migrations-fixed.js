#!/usr/bin/env node
/**
 * 执行新的数据库迁移（改进版）
 * 正确处理包含 $$ 引用的 SQL
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

// 改进的SQL分割函数 - 正确处理 $$ 引用
function splitSQL(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = null;
  let i = 0;

  while (i < sql.length) {
    // 检查 $$
    if (sql.substr(i, 2) === '$$') {
      if (!inDollarQuote) {
        // 开始 $$ 引用
        inDollarQuote = true;
        dollarTag = '$$';
        current += '$$';
        i += 2;
      } else {
        // 结束 $$ 引用
        inDollarQuote = false;
        current += '$$';
        i += 2;
      }
    } else if (sql[i] === ';' && !inDollarQuote) {
      // 语句结束（不在 $$ 引用内）
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

  // 添加最后一个语句
  if (current.trim() && !current.trim().startsWith('--')) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

// 要执行的新迁移文件
const NEW_MIGRATIONS = [
  '20260330000003_fix_start_game_initialize_private_hands.sql',
  '20260331000001_add_move_validation.sql',
  '20260331000002_add_validation_to_submit_turn.sql',
  '20260331000003_add_level_rank_column.sql',
  '20260331000004_fix_level_rank_default.sql',
];

// 执行单个迁移文件（使用独立事务）
async function executeSingleMigration(client, migration) {
  const startTime = Date.now();

  try {
    // 开始事务
    await client.query('BEGIN');

    // 读取 SQL 文件
    const sql = fs.readFileSync(migration.path, 'utf8');

    // 使用改进的分割函数
    const statements = splitSQL(sql);

    console.log(`   解析到 ${statements.length} 个 SQL 语句`);

    for (let j = 0; j < statements.length; j++) {
      const statement = statements[j].trim();
      if (statement) {
        await client.query(statement);
      }
    }

    const executionTime = Date.now() - startTime;

    // 提交事务
    await client.query('COMMIT');

    return { success: true, executionTime };
  } catch (error) {
    // 回滚事务
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // 忽略回滚错误
    }
    return { success: false, error: error.message };
  }
}

// 执行迁移
async function runMigrations() {
  console.log('=================================================');
  console.log('  新迁移执行工具（改进版）');
  console.log('=================================================\n');

  // 加载环境变量
  const envPath = path.join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 未配置');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  console.log(`📋 准备执行 ${NEW_MIGRATIONS.length} 个新迁移\n`);

  // 显示迁移列表
  NEW_MIGRATIONS.forEach((m, i) => {
    const version = m.split('_')[0];
    const name = m.substring(version.length + 1).replace('.sql', '');
    console.log(`  ${i + 1}. ${version} - ${name}`);
  });
  console.log();

  // 创建数据库连接池
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功\n');

    try {
      // 创建 schema_migrations 表（如果不存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          checksum TEXT NOT NULL,
          execution_time INTEGER NOT NULL,
          success BOOLEAN NOT NULL,
          environment TEXT NOT NULL DEFAULT 'development'
        )
      `);

      // 检查已应用的迁移
      const result = await client.query(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      const appliedVersions = new Set(result.rows.map(r => r.version));

      // 执行每个迁移
      let successCount = 0;
      let failCount = 0;

      for (const filename of NEW_MIGRATIONS) {
        const version = filename.split('_')[0];
        const name = filename.substring(version.length + 1).replace('.sql', '');
        const migrationPath = path.join(migrationsDir, filename);

        // 检查是否已应用
        if (appliedVersions.has(version)) {
          console.log(`⏭️  跳过: ${version} - ${name} (已应用)\n`);
          continue;
        }

        console.log(`-------------------------------------------------`);
        console.log(`执行: ${version} - ${name}`);
        console.log(`-------------------------------------------------`);

        const migration = { filename, version, name, path: migrationPath };
        const result = await executeSingleMigration(client, migration);

        if (result.success) {
          // 记录迁移
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
             VALUES ($1, $2, NOW(), $3, $4, true, 'development')
             ON CONFLICT (version) DO UPDATE SET
               applied_at = NOW(),
               execution_time = EXTRACT(EPOCH FROM (NOW() - applied_at)) * 1000,
               success = true`,
            [version, name, '', result.executionTime]
          );

          console.log(`✅ 成功 (${result.executionTime}ms)\n`);
          successCount++;
        } else {
          console.error(`❌ 失败: ${result.error}\n`);
          failCount++;

          // 记录失败
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
             VALUES ($1, $2, NOW(), $3, $4, false, 'development')
             ON CONFLICT (version) DO NOTHING`,
            [version, name, '', 0]
          );
        }
      }

      // 显示结果
      console.log('=================================================');
      console.log(`  执行完成: ${successCount} 成功, ${failCount} 失败`);
      console.log('=================================================\n');

      if (failCount > 0) {
        console.log('⚠️  部分迁移失败，请检查错误信息');
        console.log('💡 提示: 可以尝试手动执行失败的迁移\n');
      }

      // 显示已应用的迁移
      const finalResult = await client.query(
        'SELECT version, name, applied_at, execution_time, success FROM schema_migrations ORDER BY applied_at DESC LIMIT 10'
      );

      console.log('📋 最近应用的迁移:');
      finalResult.rows.forEach(m => {
        const status = m.success ? '✅' : '❌';
        console.log(`  ${status} ${m.version} - ${m.name} (${m.execution_time}ms)`);
      });
      console.log();

    } finally {
      client.release();
    }

  } finally {
    await pool.end();
  }
}

runMigrations().then(() => {
  console.log('=================================================');
  console.log('  迁移完成！');
  console.log('=================================================\n');
  process.exit(0);
}).catch(err => {
  console.error('=================================================');
  console.error('  发生错误');
  console.error('=================================================');
  console.error(err);
  process.exit(1);
});
