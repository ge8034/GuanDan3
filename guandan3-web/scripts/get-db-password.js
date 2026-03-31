#!/usr/bin/env node
/**
 * 获取 Supabase 数据库密码指南
 */

const chalk = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

console.log(chalk.cyan('============================================================='));
console.log(chalk.cyan('   获取 Supabase 数据库密码指南'));
console.log(chalk.cyan('============================================================='));
console.log();

console.log(chalk.yellow('步骤 1: 进入 Supabase Dashboard'));
console.log(chalk.gray('  https://supabase.com/dashboard'));
console.log();

console.log(chalk.yellow('步骤 2: 选择项目'));
console.log(chalk.gray('  项目: guandan3'));
console.log(chalk.gray('  项目 ID: rzzywltxlfgucngfiznx'));
console.log();

console.log(chalk.yellow('步骤 3: 进入数据库设置'));
console.log(chalk.gray('  导航路径:'));
console.log(chalk.gray('    ⚙️ Settings → Database'));
console.log();

console.log(chalk.yellow('步骤 4: 找到 Connection String'));
console.log(chalk.gray('  向下滚动找到 "Connection String" 部分'));
console.log(chalk.gray('  选择 "URI" 标签页'));
console.log(chalk.gray('  选择 "Transaction" 模式'));
console.log();

console.log(chalk.green('  你会看到类似这样的连接字符串:'));
console.log();
console.log(chalk.gray('  postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres'));
console.log();

console.log(chalk.red('⚠️  重要提示:'));
console.log(chalk.red('   • [YOUR-PASSWORD] 就是你的数据库密码'));
console.log(chalk.red('   • 复制完整的连接字符串，包括密码'));
console.log();

console.log(chalk.yellow('步骤 5: 复制连接字符串'));
console.log(chalk.gray('  点击连接字符串右侧的复制按钮'));
console.log();

console.log(chalk.yellow('步骤 6: 粘贴给我'));
console.log(chalk.gray('  将完整的连接字符串粘贴给我'));
console.log(chalk.gray('  格式类似:'));
console.log(chalk.gray('  postgresql://postgres.rzzywltxlfgucngfiznx:abc123...@db.rzzywltxlfgucngfiznx.supabase.co:5432/postgres'));
console.log();

console.log(chalk.cyan('============================================================='));
console.log(chalk.cyan('   连接字符串格式说明'));
console.log(chalk.cyan('============================================================='));
console.log();

console.log('postgresql://');
console.log('  postgres.rzzywltxlfgucngfiznx  ← 用户名');
console.log('  :abc123...                     ← 密码 (需要这个!)');
console.log('  @db.rzzywltxlfgucngfiznx.supabase.co  ← 主机');
console.log('  :5432                          ← 端口');
console.log('  /postgres                      ← 数据库名');
console.log();

console.log(chalk.red('═══════════════════════════════════════════════════════════════'));
console.log(chalk.red('   安全警告'));
console.log(chalk.red('═══════════════════════════════════════════════════════════════'));
console.log();
console.log(chalk.red('⚠️  数据库密码安全注意事项:'));
console.log(chalk.red('   • 绝对不要提交到 Git 仓库'));
console.log(chalk.red('   • 绝对不要在前端代码中使用'));
console.log(chalk.red('   • 绝对不要分享给他人'));
console.log(chalk.red('   • 只在服务器端环境变量中使用'));
console.log();
