#!/usr/bin/env node
/**
 * 执行数据库迁移（使用直连）
 * 使用事务和回滚机制确保安全
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

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

// 计算文件校验和
function calculateChecksum(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return createHash('sha256').update(content).digest('hex');
}

// 获取待执行的迁移文件
function getPendingMigrations(migrationsDir) {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('999'))
    .sort();

  return files.map(f => {
    const version = f.split('_')[0];
    const name = f.substring(version.length + 1).replace('.sql', '');
    return {
      filename: f,
      version,
      name,
      path: path.join(migrationsDir, f),
      checksum: calculateChecksum(path.join(migrationsDir, f))
    };
  });
}

// 执行迁移
async function runMigrations() {
  console.log('=================================================');
  console.log('  数据库迁移执行工具');
  console.log('=================================================\n');

  // 加载环境变量
  const envPath = path.join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 未配置');
    process.exit(1);
  }

  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ 迁移目录不存在:', migrationsDir);
    process.exit(1);
  }

  // 获取待执行的迁移
  const pendingMigrations = getPendingMigrations(migrationsDir);

  console.log(`📋 发现 ${pendingMigrations.length} 个迁移文件\n`);

  // 显示迁移列表
  pendingMigrations.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.version} - ${m.name}`);
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
      // 开始事务
      await client.query('BEGIN');
      console.log('🔄 开始事务\n');

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
      console.log('✅ schema_migrations 表已就绪\n');

      // 检查已应用的迁移
      const result = await client.query(
        'SELECT version FROM schema_migrations ORDER BY version'
      );
      const appliedVersions = new Set(result.rows.map(r => r.version));

      // 过滤出需要执行的迁移
      const toApply = pendingMigrations.filter(m => !appliedVersions.has(m.version));

      if (toApply.length === 0) {
        console.log('ℹ️  所有迁移都已应用，无需执行\n');
        await client.query('COMMIT');
        return;
      }

      console.log(`📝 准备执行 ${toApply.length} 个迁移\n`);

      // 执行每个迁移
      for (const migration of toApply) {
        const startTime = Date.now();
        console.log(`-------------------------------------------------`);
        console.log(`执行: ${migration.version} - ${migration.name}`);
        console.log(`-------------------------------------------------`);

        try {
          // 读取 SQL 文件
          const sql = fs.readFileSync(migration.path, 'utf8');

          // 执行 SQL（分批处理多个语句）
          const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

          for (const statement of statements) {
            if (statement.length > 0) {
              await client.query(statement);
            }
          }

          const executionTime = Date.now() - startTime;

          // 记录迁移
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
             VALUES ($1, $2, NOW(), $3, $4, true, 'development')`,
            [migration.version, migration.name, migration.checksum, executionTime]
          );

          console.log(`✅ 成功 (${executionTime}ms)\n`);
        } catch (error) {
          console.error(`❌ 失败: ${error.message}\n`);

          // 记录失败
          await client.query(
            `INSERT INTO schema_migrations (version, name, applied_at, checksum, execution_time, success, environment)
             VALUES ($1, $2, NOW(), $3, $4, false, 'development')`,
            [migration.version, migration.name, migration.checksum, Date.now() - startTime]
          );

          throw error;
        }
      }

      // 提交事务
      await client.query('COMMIT');
      console.log('=================================================');
      console.log('  ✅ 所有迁移执行成功！');
      console.log('=================================================\n');

      // 显示已应用的迁移
      const finalResult = await client.query(
        'SELECT version, name, applied_at, execution_time FROM schema_migrations ORDER BY applied_at DESC LIMIT 10'
      );

      console.log('📋 最近应用的迁移:');
      finalResult.rows.forEach(m => {
        console.log(`  ${m.version} - ${m.name} (${m.executionTime}ms)`);
      });
      console.log();

    } catch (error) {
      // 回滚事务
      await client.query('ROLLBACK');
      console.error('❌ 迁移失败，已回滚所有更改');
      console.error(`   错误: ${error.message}\n`);
      throw error;
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
  console.error('  迁移失败');
  console.error('=================================================\n');
  process.exit(1);
});
