#!/usr/bin/env node
/**
 * 测试 PostgreSQL 数据库直连
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

async function testConnection() {
  console.log('=================================================');
  console.log('  PostgreSQL 数据库连接测试');
  console.log('=================================================\n');

  // 加载环境变量
  const envPath = path.join(process.cwd(), '.env.local');
  const env = parseEnvFile(envPath);

  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 未配置');
    process.exit(1);
  }

  console.log('📋 连接信息:');
  const url = new URL(env.DATABASE_URL);
  console.log(`  主机: ${url.hostname}`);
  console.log(`  端口: ${url.port}`);
  console.log(`  数据库: ${url.pathname.substring(1)}`);
  console.log(`  用户: ${url.username}`);
  console.log(`  密码: ${'*'.repeat(url.password.length)}\n`);

  console.log('-------------------------------------------------');
  console.log('正在连接数据库...');
  console.log('-------------------------------------------------\n');

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ 数据库连接成功！\n');

    // 测试查询
    console.log('执行测试查询...');
    const result = await client.query(`
      SELECT
        version(),
        current_database(),
        current_user,
        inet_server_addr(),
        inet_server_port()
    `);

    console.log('📊 数据库信息:');
    console.log(`  版本: ${result.rows[0].version?.split(' ')[0] || 'PostgreSQL'}`);
    console.log(`  数据库: ${result.rows[0].current_database}`);
    console.log(`  用户: ${result.rows[0].current_user}`);
    console.log(`  地址: ${result.rows[0].inet_server_addr}:${result.rows[0].inet_server_port}\n`);

    // 检查 schema_migrations 表
    console.log('检查 schema_migrations 表...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'schema_migrations'
      )
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ schema_migrations 表已存在\n');
      const migrations = await client.query(`
        SELECT version, name, applied_at, success
        FROM schema_migrations
        ORDER BY applied_at DESC
        LIMIT 10
      `);
      if (migrations.rows.length > 0) {
        console.log('📋 最近应用的迁移:');
        migrations.rows.forEach(m => {
          console.log(`  ${m.version} - ${m.name} (${m.success ? '✅' : '❌'})`);
        });
      } else {
        console.log('  (暂无迁移记录)');
      }
    } else {
      console.log('ℹ️  schema_migrations 表不存在（首次运行）\n');
    }

    client.release();
    console.log('\n=================================================');
    console.log('  连接测试完成 ✅');
    console.log('=================================================\n');

    return true;
  } catch (error) {
    console.error('❌ 连接失败!');
    console.error(`   错误: ${error.message}\n`);

    if (error.code === 'ECONNREFUSED') {
      console.log('💡 提示: 连接被拒绝，请检查:');
      console.log('   1. 密码是否正确');
      console.log('   2. 主机名和端口是否正确');
      console.log('   3. 数据库是否正在运行\n');
    } else if (error.code === '28P01') {
      console.log('💡 提示: 密码认证失败');
      console.log('   请重置数据库密码后重试\n');
    }

    return false;
  } finally {
    await pool.end();
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
