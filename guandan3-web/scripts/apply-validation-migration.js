/**
 * 应用服务端牌型验证迁移
 * 只执行最新的验证逻辑迁移文件
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
}

loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  console.error('需要: NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 或 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('');
  console.error('请创建 .env.local 文件并配置以下变量:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 迁移文件路径
const migrationFile = path.join(__dirname, '..', 'supabase', 'migrations', '20260331000002_add_validation_to_submit_turn.sql');
const migrationSQL = fs.readFileSync(migrationFile, 'utf8');

async function testConnection() {
  console.log('测试数据库连接...');
  try {
    const { data, error } = await supabase.from('rooms').select('*').limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('✓ 数据库连接成功');
    return true;
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
    console.error('\n无法继续，请检查数据库连接');
    process.exit(1);
  }

  console.log('\n开始执行迁移...');

  try {
    // 使用 Supabase REST API 直接执行 SQL
    // 注意: 这需要 service_role key 和数据库连接
    // 如果失败了，需要使用 Supabase Dashboard 或 psql 手动执行

    console.log('\n注意: 此脚本使用 Supabase REST API 执行 SQL');
    console.log('如果失败，请使用 Supabase Dashboard 的 SQL Editor 手动执行迁移文件:');
    console.log(`  ${migrationFile}`);
    console.log('');
    console.log('迁移内容包括:');
    console.log('  1. 创建 validate_guandan_move 函数 - 验证掼蛋牌型');
    console.log('  2. 更新 submit_turn 函数 - 添加牌型验证逻辑');
    console.log('');
    console.log('验证规则:');
    console.log('  - 炸弹(4张+)可以压任何非炸弹');
    console.log('  - 炸弹对炸弹: 张数多赢,张数相同比点数');
    console.log('  - 非炸弹必须与上家牌数相同');
    console.log('  - 无效牌型将被拒绝');

    console.log('\n========================================');
    console.log('请使用 Supabase Dashboard 执行迁移');
    console.log('========================================');

  } catch (error) {
    console.error('\n错误:', error.message);
    process.exit(1);
  }
}

applyMigration().catch(err => {
  console.error('\n致命错误:', err);
  process.exit(1);
});
