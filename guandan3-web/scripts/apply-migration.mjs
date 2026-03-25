#!/usr/bin/env node
/**
 * 应用数据库迁移到 Supabase
 * 用法: node scripts/apply-migration.js <migration-file>
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 从 .env.local 读取配置
function loadEnvConfig() {
  try {
    const envPath = join(__dirname, '../.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const config = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^NEXT_PUBLIC_(.+)=(.+)$/);
      if (match) {
        const key = match[1].toLowerCase();
        config[key] = match[2].trim();
      }
    });
    return config;
  } catch (e) {
    console.error('无法读取 .env.local 文件:', e.message);
    process.exit(1);
  }
}

async function applyMigration() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('用法: node apply-migration.js <migration-file>');
    console.log('');
    console.log('示例: node apply-migration.js 011_fix_practice_mode_start_game.sql');
    console.log('');
    console.log('或者应用所有待处理的迁移:');
    console.log('  node apply-migration.js --all');
    process.exit(1);
  }

  const config = loadEnvConfig();
  const supabase = createClient(config.supabase_url, config.supabase_anon_key);

  if (args[0] === '--all') {
    // 应用所有新迁移
    const migrations = [
      '011_fix_practice_mode_start_game.sql'
    ];

    console.log(`准备应用 ${migrations.length} 个迁移...`);

    for (const migration of migrations) {
      await applySingleMigration(supabase, migration);
    }
  } else {
    await applySingleMigration(supabase, args[0]);
  }
}

async function applySingleMigration(supabase, filename) {
  const migrationPath = join(__dirname, `../supabase/migrations/${filename}`);

  console.log(`\n========================================`);
  console.log(`应用迁移: ${filename}`);
  console.log(`========================================`);

  try {
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('执行 SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // exec_sql 不存在，尝试直接使用 SQL
      console.log('使用 RPC 调用失败，尝试直接执行...');
      console.log('⚠️  请在 Supabase Dashboard 中手动执行以下 SQL:');
      console.log('---');
      console.log(sql);
      console.log('---');
      console.log('');
      console.log('步骤：');
      console.log('1. 访问 https://supabase.com/dashboard');
      console.log('2. 选择你的项目');
      console.log('3. 进入 SQL Editor');
      console.log('4. 粘贴上面的 SQL 并执行');
      return;
    }

    console.log('✓ 迁移应用成功!');
  } catch (e) {
    console.error(`✗ 读取迁移文件失败:`, e.message);
    process.exit(1);
  }
}

applyMigration().catch(console.error);
