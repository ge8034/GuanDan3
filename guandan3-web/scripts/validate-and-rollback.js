#!/usr/bin/env node
/**
 * 迁移验证和回滚脚本生成器
 * 用于数据库连接不可用时进行离线验证
 */

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

// ============================================================
// SQL 验证器
// ============================================================

function validateSQL(sql, filename) {
  const errors = [];
  const warnings = [];
  const operations = [];
  const dangerousPatterns = [];

  const lines = sql.split('\n');

  // 危险模式检测
  const dangerPatterns = [
    { pattern: /drop\s+table/i, type: 'DROP_TABLE', severity: 'error', desc: '删除表操作' },
    { pattern: /truncate\s+/i, type: 'TRUNCATE', severity: 'error', desc: '清空表操作' },
    { pattern: /delete\s+from\s+\w+\s*(?!where).*;/i, type: 'UNCONDITIONAL_DELETE', severity: 'error', desc: '无条件删除' },
    { pattern: /update\s+\w+\s+set\s+.+\s*(?!where).*;/i, type: 'UNCONDITIONAL_UPDATE', severity: 'error', desc: '无条件更新' },
    { pattern: /select\s+\*/i, type: 'FULL_TABLE_SCAN', severity: 'warning', desc: '可能全表扫描' },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('--') || line.startsWith('/*')) continue;

    for (const { pattern, type, severity, desc } of dangerPatterns) {
      if (pattern.test(line)) {
        dangerousPatterns.push({ type, line: i + 1, desc, severity });
        if (severity === 'error') {
          errors.push(`[行 ${i + 1}] ${desc}`);
        } else {
          warnings.push(`[行 ${i + 1}] ${desc}`);
        }
      }
    }
  }

  // 操作类型检测
  const opPatterns = [
    { pattern: /create\s+(or\s+replace\s+)?table/i, type: 'CREATE_TABLE' },
    { pattern: /alter\s+table/i, type: 'ALTER_TABLE' },
    { pattern: /create\s+(unique\s+)?index/i, type: 'CREATE_INDEX' },
    { pattern: /drop\s+index/i, type: 'DROP_INDEX' },
    { pattern: /create\s+(or\s+replace\s+)?function/i, type: 'CREATE_FUNCTION' },
    { pattern: /drop\s+function/i, type: 'DROP_FUNCTION' },
    { pattern: /create\s+trigger/i, type: 'CREATE_TRIGGER' },
    { pattern: /drop\s+trigger/i, type: 'DROP_TRIGGER' },
    { pattern: /grant\s+/i, type: 'GRANT' },
    { pattern: /revoke\s+/i, type: 'REVOKE' },
    { pattern: /insert\s+into/i, type: 'INSERT' },
    { pattern: /update\s+/i, type: 'UPDATE' },
    { pattern: /delete\s+from/i, type: 'DELETE' },
  ];

  const sqlUpper = sql.toUpperCase();
  for (const { pattern, type } of opPatterns) {
    if (pattern.test(sqlUpper)) {
      operations.push(type);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    operations: [...new Set(operations)],
    dangerousPatterns,
  };
}

// ============================================================
// 回滚生成器
// ============================================================

function generateRollback(filename, sql) {
  let rollback = `-- ============================================================\n`;
  rollback += `-- 回滚脚本: ${filename}\n`;
  rollback += `-- 生成时间: ${new Date().toISOString()}\n`;
  rollback += `-- ============================================================\n`;
  rollback += `-- 注意: 此脚本由自动工具生成，请在执行前仔细检查\n`;
  rollback += `-- ============================================================\n\n`;

  const lines = sql.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'));
  const statements = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('CREATE TABLE')) {
      const match = trimmed.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w"`.]*\.)?[\w"`.]+/i);
      if (match) {
        const tableName = match[0].replace(/CREATE\s+(?:OR\s+REPLACE\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, '').replace(/[\w"`.]*\./, '').trim();
        rollback += `-- 回滚: DROP TABLE ${tableName}\n`;
        rollback += `DROP TABLE IF EXISTS ${tableName} CASCADE;\n\n`;
      }
    } else if (upper.startsWith('CREATE INDEX') || upper.startsWith('CREATE UNIQUE INDEX')) {
      const match = trimmed.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[\w"`.]*\.)?[\w"`.]+/i);
      if (match) {
        const indexName = match[0].replace(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, '').replace(/[\w"`.]*\./, '').trim();
        rollback += `-- 回滚: DROP INDEX ${indexName}\n`;
        rollback += `DROP INDEX IF EXISTS ${indexName};\n\n`;
      }
    } else if (upper.startsWith('ALTER TABLE')) {
      if (upper.includes('ADD COLUMN')) {
        const match = trimmed.match(/ALTER\s+TABLE\s+(?:[\w"`.]*\.)?[\w"`.]+\s+ADD\s+(?:COLUMN\s+)?[\w"`.]+/i);
        if (match) {
          const parts = match[0].split(/ADD\s+(?:COLUMN\s+)?/i);
          const tableName = parts[0].replace(/ALTER\s+TABLE\s+/i, '').replace(/[\w"`.]*\./, '').trim();
          const columnName = parts[1].trim();
          rollback += `-- 回滚: DROP COLUMN ${columnName}\n`;
          rollback += `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${columnName};\n\n`;
        }
      } else if (upper.includes('DROP COLUMN')) {
        rollback += `-- 注意: DROP COLUMN 操作无法自动回滚\n`;
        rollback += `-- 请手动重新添加列和数据\n\n`;
      } else if (upper.includes('ADD CONSTRAINT')) {
        const match = trimmed.match(/ADD\s+CONSTRAINT\s+[\w"`.]+/i);
        if (match) {
          const parts = match[0].split(/CONSTRAINT\s+/i);
          const constraintName = parts[1] ? parts[1].split(/\s/)[0] : 'unknown';
          const tableName = trimmed.match(/ALTER\s+TABLE\s+(?:[\w"`.]*\.)?[\w"`.]+/i);
          if (tableName) {
            const tableNameStr = tableName[0].replace(/ALTER\s+TABLE\s+/i, '').replace(/[\w"`.]*\./, '').trim();
            rollback += `-- 回滚: DROP CONSTRAINT ${constraintName}\n`;
            rollback += `ALTER TABLE ${tableNameStr} DROP CONSTRAINT IF EXISTS ${constraintName};\n\n`;
          }
        }
      } else {
        rollback += `-- 注意: 此 ALTER TABLE 操作无法自动回滚\n`;
        rollback += `-- ${trimmed.substring(0, 100)}...\n\n`;
      }
    } else if (upper.startsWith('CREATE FUNCTION') || upper.startsWith('CREATE OR REPLACE FUNCTION')) {
      const match = trimmed.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:IF\s+NOT\s+EXISTS\s+)?[\w"`.]+/i);
      if (match) {
        const funcName = match[0].replace(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(?:IF\s+NOT\s+EXISTS\s+)?/i, '').replace(/[\w"`.]*\./, '').trim();
        rollback += `-- 回滚: DROP FUNCTION ${funcName}\n`;
        rollback += `DROP FUNCTION IF EXISTS ${funcName} CASCADE;\n\n`;
      }
    } else if (upper.startsWith('CREATE TRIGGER') || upper.startsWith('CREATE OR REPLACE TRIGGER')) {
      const match = trimmed.match(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+[\w"`.]+/i);
      if (match) {
        const triggerName = match[0].replace(/CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+/i, '').replace(/[\w"`.]*\./, '').trim();
        rollback += `-- 回滚: DROP TRIGGER ${triggerName}\n`;
        rollback += `DROP TRIGGER IF EXISTS ${triggerName} ON table_name;\n\n`;
      }
    } else if (upper.startsWith('GRANT')) {
      const revokeSql = trimmed.replace(/GRANT\s+/i, 'REVOKE ').replace(/\s+TO\s+/i, ' FROM ');
      rollback += `-- 回滚: ${revokeSql}\n`;
      rollback += revokeSql.replace(';', ';\n\n');
    }
  }

  rollback += `-- ============================================================\n`;
  rollback += `-- 回滚脚本结束\n`;
  rollback += `-- ============================================================\n`;

  return rollback;
}

// ============================================================
// 主程序
// ============================================================

async function main() {
  const migrationsDir = path.join(process.cwd(), 'supabase/migrations');

  // 获取待处理的迁移文件
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && !f.startsWith('999'))
    .sort()
    .slice(-5); // 只处理最新的 5 个

  console.log('='.repeat(60));
  console.log('迁移文件验证和回滚脚本生成');
  console.log('='.repeat(60));
  console.log(`发现 ${files.length} 个迁移文件\n`);

  // 确保回滚目录存在
  const rollbackDir = path.join(process.cwd(), 'supabase/rollback');
  if (!fs.existsSync(rollbackDir)) {
    fs.mkdirSync(rollbackDir, { recursive: true });
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');

    console.log(`\n${'='.repeat(60)}`);
    console.log(`文件: ${file}`);
    console.log(`校验和: ${checksum.substring(0, 16)}...`);
    console.log(`大小: ${sql.length} 字节`);
    console.log('='.repeat(60));

    // 验证 SQL
    const result = validateSQL(sql, file);

    console.log(`\n操作类型: ${result.operations.join(', ') || '无'}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ 错误 (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  警告 (${result.warnings.length}):`);
      result.warnings.forEach(warn => console.log(`  - ${warn}`));
    }

    if (result.dangerousPatterns.length > 0) {
      console.log(`\n⚠️  危险操作:`);
      result.dangerousPatterns.forEach(p => {
        const icon = p.severity === 'error' ? '❌' : '⚠️';
        console.log(`  ${icon} [行 ${p.line}] ${p.desc}`);
      });
    }

    // 生成回滚脚本
    const version = file.replace(/(\d{14})_.*/, '$1');
    const rollback = generateRollback(file, sql);
    const rollbackFile = path.join(rollbackDir, `rollback_${version}_${file}`);

    fs.writeFileSync(rollbackFile, rollback, 'utf8');
    console.log(`\n✅ 回滚脚本已生成: ${path.basename(rollbackFile)}`);

    // 生成摘要
    const isValid = result.errors.length === 0;
    console.log(`\n状态: ${isValid ? '✅ 通过' : '❌ 有错误'}`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('验证完成！');
  console.log('='.repeat(60));
  console.log('\n提示: 由于数据库连接失败，无法自动执行迁移。');
  console.log('请手动将迁移文件在 Supabase SQL Editor 中执行。');
}

main().catch(console.error);
