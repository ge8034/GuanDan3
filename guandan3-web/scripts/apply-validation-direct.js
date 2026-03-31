/**
 * 直接使用 pg 连接应用迁移
 */
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }

  // 同时尝试 .env.production
  const envProdPath = path.join(__dirname, '..', '.env.production');
  if (fs.existsSync(envProdPath)) {
    const envContent = fs.readFileSync(envProdPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 优先使用 service_role_key，如果没有则尝试数据库密码
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('错误: 缺少 NEXT_PUBLIC_SUPABASE_URL 环境变量');
  process.exit(1);
}

// 从 Supabase URL 提取 project ref
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const connectionString = `postgresql://postgres.db_${projectRef}:${dbPassword}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

console.log(`项目引用: ${projectRef}`);
console.log(`连接字符串: ${connectionString.replace(dbPassword, '***')}`);

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260331000002_add_validation_to_submit_turn.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

async function testConnection() {
  console.log('测试数据库连接...');
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT NOW()');
      console.log('✓ 数据库连接成功');
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('✗ 数据库连接失败:');
    console.error(`  ${error.message}`);
    return false;
  }
}

async function applyMigration() {
  console.log('========================================');
  console.log('应用服务端牌型验证迁移');
  console.log('========================================');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`迁移文件: ${path.basename(migrationFile)}`);
  console.log('');

  const connected = await testConnection();
  if (!connected) {
    console.error('\n无法连接数据库');
    console.error('');
    console.error('请确保 .env.local 或 .env.production 中配置了:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('  SUPABASE_DB_PASSWORD=your-database-password');
    console.error('');
    console.error('或者使用 Supabase Dashboard 的 SQL Editor 手动执行:');
    console.error(`  ${migrationFile}`);
    process.exit(1);
  }

  console.log('\n开始执行迁移...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 执行迁移
    await client.query(migrationSQL);

    await client.query('COMMIT');

    console.log('✓ 迁移执行成功!');
    console.log('');
    console.log('已添加的验证功能:');
    console.log('  1. validate_guandan_move - 牌型验证函数');
    console.log('  2. submit_turn 已更新 - 添加牌型验证调用');
    console.log('');
    console.log('验证规则:');
    console.log('  - 炸弹(4张+)可以压任何非炸弹');
    console.log('  - 炸弹对炸弹: 张数多赢,张数相同比点数');
    console.log('  - 非炸弹必须与上家牌数相同');
    console.log('  - 无效牌型将返回 "invalid_move" 错误');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ 迁移执行失败:');
    console.error(`  ${error.message}`);
    console.error('');
    console.error('请检查 SQL 是否正确，或使用 Supabase Dashboard 手动执行');
    process.exit(1);
  } finally {
    client.release();
  }

  await pool.end();

  console.log('\n========================================');
  console.log('✅ 服务端牌型验证已启用');
  console.log('========================================');
}

applyMigration().catch(err => {
  console.error('\n致命错误:', err);
  process.exit(1);
});
