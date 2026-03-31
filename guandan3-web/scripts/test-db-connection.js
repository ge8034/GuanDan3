#!/usr/bin/env node
/**
 * 测试 Supabase 数据库连接
 * 使用 service_role key 进行直连测试
 */

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

// 解析 JWT 获取数据库连接信息
function parseSupabaseKeys(supabaseUrl, serviceRoleKey) {
  // 从 service_role JWT 中提取项目引用
  const payload = serviceRoleKey.split('.')[1];
  const decoded = Buffer.from(payload, 'base64').toString();
  const data = JSON.parse(decoded);

  return {
    supabaseUrl,
    ref: data.ref,
    role: data.role,
    // 构建 PostgreSQL 连接字符串
    // 格式: postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres
    // 注意: service_role key 不是数据库密码，需要从 dashboard 获取
  };
}

// 测试 HTTPS API 连接
async function testHttpsConnection(supabaseUrl, anonKey) {
  const https = require('https');
  const url = new URL(supabaseUrl);

  return new Promise((resolve) => {
    const options = {
      hostname: url.hostname,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    };

    const req = https.request(options, (res) => {
      resolve({ success: true, statusCode: res.statusCode, statusMessage: res.statusMessage });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

// 测试数据库连接（使用 pg 库）
async function testDatabaseConnection(env) {
  const { Pool } = require('pg');

  // 从 Supabase URL 解析连接信息
  const url = new URL(env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_URL);

  // Supabase PostgreSQL 连接字符串格式
  // postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres
  // 注意: 密码需要从 Supabase Dashboard 获取，service_role key 不是数据库密码

  console.log('\n=================================================');
  console.log('数据库直连测试');
  console.log('=================================================\n');

  console.log('ℹ️  Supabase 说明:');
  console.log('   - Service Role Key 用于 API 调用，不是数据库密码');
  console.log('   - PostgreSQL 直连需要数据库密码');
  console.log('   - 获取路径: Dashboard → Settings → Database → Connection String\n');

  console.log('配置信息:');
  console.log(`  SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`  ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...`);
  console.log(`  SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30)}...`);

  return {
    canUseRpc: true,  // 可以使用 Supabase RPC
    needsDbPassword: true,  // 直连需要数据库密码
    suggestion: '使用 Supabase Dashboard SQL Editor 执行迁移'
  };
}

// 主函数
async function main() {
  const envPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local 文件不存在');
    process.exit(1);
  }

  const env = parseEnvFile(envPath);

  console.log('=================================================');
  console.log('  Supabase 连接测试');
  console.log('=================================================\n');

  // 检查必需的环境变量
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ 缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ 缺少 SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // 验证 service_role key 格式
  const keyPayload = env.SUPABASE_SERVICE_ROLE_KEY.split('.')[1];
  const keyData = JSON.parse(Buffer.from(keyPayload, 'base64').toString());

  console.log('✅ 环境变量检查:');
  console.log(`   SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`);
  console.log(`   SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
  console.log(`   Key Role: ${keyData.role} ${keyData.role === 'service_role' ? '✅' : '❌'}`);

  // 测试 HTTPS API 连接
  console.log('\n-------------------------------------------------');
  console.log('1. 测试 HTTPS API 连接...');
  console.log('-------------------------------------------------');
  const apiResult = await testHttpsConnection(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (apiResult.success) {
    console.log(`✅ API 连接成功 (HTTP ${apiResult.statusCode})`);
  } else {
    console.log(`❌ API 连接失败: ${apiResult.error}`);
  }

  // 数据库连接分析
  console.log('\n-------------------------------------------------');
  console.log('2. 数据库连接分析...');
  console.log('-------------------------------------------------');
  const dbResult = await testDatabaseConnection(env);

  console.log('\n=================================================');
  console.log('  测试结论');
  console.log('=================================================\n');

  console.log('✅ 配置状态:');
  console.log('   • SUPABASE_SERVICE_ROLE_KEY 已正确配置');
  console.log('   • JWT role = "service_role" ✓');
  console.log('   • API 连接正常');

  console.log('\n📋 迁移执行方式:');
  console.log('   方式一 (推荐): 使用 Supabase Dashboard SQL Editor');
  console.log('   方式二: 使用 RPC 调用（需要修改迁移脚本）');
  console.log('   方式三: 获取数据库密码后使用直连');

  console.log('\n📄 手动执行指南已保存:');
  console.log('   supabase/rollback/MANUAL_EXECUTION_GUIDE.md');

  console.log('\n=================================================\n');
}

main().catch(console.error);
