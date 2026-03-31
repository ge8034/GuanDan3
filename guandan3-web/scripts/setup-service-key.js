#!/usr/bin/env node
/**
 * 获取 Service Role Key 操作指南
 *
 * 注意：这个脚本无法自动访问 Supabase Dashboard，需要手动操作
 */

const chalk = require('chalk');

console.log(chalk.cyan('============================================================='));
console.log(chalk.cyan('   Supabase Service Role Key 获取指南'));
console.log(chalk.cyan('============================================================='));
console.log();

console.log(chalk.yellow('步骤 1: 登录 Supabase Dashboard'));
console.log(chalk.gray('  访问: https://supabase.com/dashboard'));
console.log();

console.log(chalk.yellow('步骤 2: 选择项目'));
console.log(chalk.gray('  在项目列表中选择 "guandan3" 项目'));
console.log(chalk.gray('  项目 ID: rzzywltxlfgucngfiznx'));
console.log();

console.log(chalk.yellow('步骤 3: 获取 API 密钥'));
console.log(chalk.gray('  导航路径:'));
console.log(chalk.gray('    Settings (齿轮图标) → API → Project API keys'));
console.log();

console.log(chalk.green('  找到 "service_role" 密钥（通常显示为 eyJhbG...）'));
console.log(chalk.red('  ⚠️  这个密钥具有完全访问权限，请妥善保管！'));
console.log();

console.log(chalk.yellow('步骤 4: 复制密钥'));
console.log(chalk.gray('  点击密钥右侧的复制按钮'));
console.log();

console.log(chalk.yellow('步骤 5: 添加到 .env.local'));
console.log(chalk.gray('  在项目根目录的 .env.local 文件中添加:'));
console.log();
console.log(chalk.green('  SUPABASE_SERVICE_ROLE_KEY=你复制的密钥'));
console.log();

console.log(chalk.cyan('============================================================='));
console.log(chalk.cyan('   验证配置'));
console.log(chalk.cyan('============================================================='));
console.log();

console.log(chalk.yellow('完成配置后，运行以下命令验证:'));
console.log();
console.log(chalk.gray('  # 检查环境变量是否加载'));
console.log(chalk.cyan('  npm run migrate:status'));
console.log();
console.log(chalk.gray('  # 测试数据库连接'));
console.log(chalk.cyan('  npm run migrate:validate -- supabase/migrations/*.sql'));
console.log();
console.log(chalk.gray('  # 执行所有待处理迁移'));
console.log(chalk.cyan('  npm run migrate:all'));
console.log();

console.log(chalk.red('═══════════════════════════════════════════════════════════════'));
console.log(chalk.red('   安全警告'));
console.log(chalk.red('═══════════════════════════════════════════════════════════════'));
console.log();
console.log(chalk.red('⚠️  SERVICE_ROLE_KEY 安全注意事项:'));
console.log(chalk.red('   • 绝对不要提交到 Git 仓库'));
console.log(chalk.red('   • 绝对不要在前端代码中使用'));
console.log(chalk.red('   • 绝对不要分享给他人'));
console.log(chalk.red('   • 只在服务器端使用'));
console.log();

// 检查 .env.local 是否存在
const fs = require('fs');
const path = require('path');
const envPath = path.join(process.cwd(), '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY');

  console.log(chalk.cyan('============================================================='));
  console.log(chalk.cyan('   当前状态'));
  console.log(chalk.cyan('============================================================='));
  console.log();

  if (hasServiceKey) {
    console.log(chalk.green('✅ .env.local 中已配置 SUPABASE_SERVICE_ROLE_KEY'));
    console.log();
    console.log(chalk.gray('当前配置项:'));
    envContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          // 只显示前10个字符和后10个字符
          const displayValue = value.length > 30
            ? `${value.substring(0, 15)}...${value.substring(value.length - 10)}`
            : value;
          console.log(chalk.gray(`  ${key}=${displayValue}`));
        }
      });
    console.log();
    console.log(chalk.green('可以尝试运行迁移命令了！'));
  } else {
    console.log(chalk.yellow('⚠️  .env.local 存在但缺少 SUPABASE_SERVICE_ROLE_KEY'));
    console.log();
    console.log(chalk.gray('当前配置项:'));
    envContent.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          const displayValue = value.length > 30
            ? `${value.substring(0, 15)}...${value.substring(value.length - 10)}`
            : value;
          console.log(chalk.gray(`  ${key}=${displayValue}`));
        }
      });
    console.log();
    console.log(chalk.yellow('请按上述步骤添加 SUPABASE_SERVICE_ROLE_KEY'));
  }
} else {
  console.log(chalk.yellow('⚠️  .env.local 文件不存在'));
  console.log();
  console.log(chalk.gray('可以从 .env.local.example 复制模板:'));
  console.log(chalk.cyan('  cp .env.local.example .env.local'));
}

console.log();
