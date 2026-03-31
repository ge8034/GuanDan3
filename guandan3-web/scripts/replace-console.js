/**
 * 批量替换 console 语句为 logger 语句的脚本
 *
 * 用法：node scripts/replace-console.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, '../src');

// 递归查找所有 TypeScript 文件
function findTypeScriptFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        findTypeScriptFiles(filePath, fileList);
      }
    } else if (stat.isFile() && /\.(ts|tsx)$/.test(file)) {
      // 跳过测试文件
      if (!file.includes('.test.')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

// 处理单个文件
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 检查文件是否包含 console 语句
  if (!/console\.(log|info|warn|error|debug)/.test(content)) {
    return { modified: false, hasLoggerImport: false };
  }

  // 检查是否已经导入了 logger
  const hasLoggerImport = /import\s+.*\s+from\s+['"]@\/lib\/utils\/logger['"]/.test(content);

  // 替换 console.log -> logger.debug
  if (content.includes('console.log')) {
    content = content.replace(/console\.log/g, 'logger.debug');
    modified = true;
  }

  // 替换 console.info -> logger.info
  if (content.includes('console.info')) {
    content = content.replace(/console\.info/g, 'logger.info');
    modified = true;
  }

  // 替换 console.warn -> logger.warn
  if (content.includes('console.warn')) {
    content = content.replace(/console\.warn/g, 'logger.warn');
    modified = true;
  }

  // 替换 console.error -> logger.error
  if (content.includes('console.error')) {
    content = content.replace(/console\.error/g, 'logger.error');
    modified = true;
  }

  // 替换 console.debug -> logger.debug
  if (content.includes('console.debug')) {
    content = content.replace(/console\.debug/g, 'logger.debug');
    modified = true;
  }

  // 如果修改了文件且没有导入 logger，则添加导入
  if (modified && !hasLoggerImport) {
    // 查找最后一个 import 语句
    const importRegex = /import\s+.*from\s+['"][^'"]+['"];?\s*\n/g;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      // 检查是否需要添加换行
      const needsNewline = content.charAt(insertPosition) !== '\n';
      const loggerImport = `import { logger } from '@/lib/utils/logger'\n${needsNewline ? '\n' : ''}`;

      content = content.slice(0, insertPosition) + loggerImport + content.slice(insertPosition);
    }
  }

  // 移除旧的 devLog 和 devError 导入（如果存在）
  content = content.replace(/import\s+.*\s+from\s+['"]@\/lib\/utils\/devLog['"][;\s]*\n?/g, '');
  content = content.replace(/import\s+.*\s+from\s+['"]@\/lib\/utils\/logger['"][;\s]*\n?/g, '');

  // 重新添加 logger 导入（如果需要）
  if (modified && !hasLoggerImport) {
    const importRegex = /import\s+.*from\s+['"][^'"]+['"];?\s*\n/g;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      content = content.slice(0, insertPosition) + `import { logger } from '@/lib/utils/logger'\n` + content.slice(insertPosition);
    }
  }

  // 写回文件
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }

  return { modified, hasLoggerImport };
}

// 主函数
function main() {
  console.log('开始批量替换 console 语句...\n');

  const files = findTypeScriptFiles(srcDir);
  console.log(`找到 ${files.length} 个 TypeScript 文件\n`);

  let modifiedCount = 0;
  let consoleCount = 0;
  const errors = [];

  files.forEach(filePath => {
    try {
      const result = processFile(filePath);
      if (result.modified) {
        modifiedCount++;
        const relativePath = path.relative(srcDir, filePath);
        console.log(`✓ 已处理: ${relativePath}`);
      }
    } catch (error) {
      errors.push({ file: filePath, error: error.message });
      console.error(`✗ 处理失败: ${filePath}`);
      console.error(`  错误: ${error.message}\n`);
    }
  });

  // 统计剩余的 console 语句
  try {
    const result = execSync('grep -r "console\\.\\(log\\|info\\|warn\\|error\\|debug\\)" src --include="*.ts" --include="*.tsx" | grep -v ".test." | wc -l', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    consoleCount = parseInt(result.trim(), 10);
  } catch (error) {
    console.warn('无法统计剩余 console 语句数量');
  }

  console.log('\n========================================');
  console.log('处理完成！');
  console.log('========================================');
  console.log(`处理的文件数量: ${modifiedCount}`);
  console.log(`剩余 console 语句: ${consoleCount}`);
  console.log(`错误数量: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n错误详情:');
    errors.forEach(({ file, error }) => {
      console.log(`  ${file}: ${error}`);
    });
  }

  console.log('\n下一步：');
  console.log('1. 运行 npm run lint 检查代码风格');
  console.log('2. 运行 npm run typecheck 检查类型错误');
  console.log('3. 运行 npm test 确保测试通过');
}

main();
