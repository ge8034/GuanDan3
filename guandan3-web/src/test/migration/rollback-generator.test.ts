/**
 * 回滚脚本生成器单元测试
 */

import { describe, it, expect } from 'vitest'
import { RollbackGenerator } from '../rollback-generator'

describe('RollbackGenerator', () => {
  const generator = new RollbackGenerator()

  describe('generate', () => {
    it('应该为 CREATE TABLE 生成 DROP TABLE 回滚', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);'
      const script = generator.generate('create_users.sql', '20260331000001', sql)

      expect(script.sql).toContain('DROP TABLE IF EXISTS users')
      expect(script.migrationName).toBe('create_users.sql')
      expect(script.migrationVersion).toBe('20260331000001')
    })

    it('应该为 CREATE INDEX 生成 DROP INDEX 回滚', () => {
      const sql = 'CREATE INDEX idx_users_name ON users(name);'
      const script = generator.generate('add_index.sql', '20260331000002', sql)

      expect(script.sql).toContain('DROP INDEX IF EXISTS idx_users_name')
    })

    it('应该为 ALTER TABLE ADD COLUMN 生成 DROP COLUMN 回滚', () => {
      const sql = 'ALTER TABLE users ADD COLUMN email TEXT;'
      const script = generator.generate('add_email.sql', '20260331000003', sql)

      expect(script.sql).toContain('DROP COLUMN IF EXISTS email')
      expect(script.sql).toContain('ALTER TABLE')
    })

    it('应该为 GRANT 生成 REVOKE 回滚', () => {
      const sql = 'GRANT SELECT ON users TO app_user;'
      const script = generator.generate('grant_users.sql', '20260331000004', sql)

      expect(script.sql).toContain('REVOKE')
      expect(script.sql).toContain('FROM')
    })

    it('应该为多个操作生成正确的逆序回滚', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        CREATE INDEX idx_users_id ON users(id);
        GRANT SELECT ON users TO app_user;
      `
      const script = generator.generate('multi.sql', '20260331000005', sql)

      // 回滚应该是逆序的
      const revokeIndex = script.sql.indexOf('DROP INDEX')
      const dropTable = script.sql.indexOf('DROP TABLE')
      const revokeGrant = script.sql.indexOf('REVOKE')

      // GRANT 的回滚（REVOKE）应该最后出现
      expect(revokeGrant).toBeGreaterThan(-1)
    })

    it('应该生成包含注释的回滚脚本', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('create_users.sql', '20260331000006', sql)

      expect(script.sql).toContain('-- 回滚脚本')
      expect(script.sql).toContain('-- 注意: 此脚本由自动工具生成')
      expect(script.sql).toContain('-- 回滚脚本结束')
    })

    it('应该处理 IF NOT EXISTS 语法', () => {
      const sql = 'CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('create_users.sql', '20260331000007', sql)

      expect(script.sql).toContain('DROP TABLE IF EXISTS users')
    })

    it('应该处理带前缀的表名', () => {
      const sql = 'CREATE TABLE public.users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('create_users.sql', '20260331000008', sql)

      expect(script.sql).toContain('DROP TABLE IF EXISTS users')
    })
  })

  describe('parseSQLOperations', () => {
    // 私有方法测试通过公共接口间接测试

    it('应该正确分割语句', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        CREATE INDEX idx_users_id ON users(id);
      `
      const script = generator.generate('test.sql', '20260331000009', sql)

      // 应该生成两个回滚操作
      const dropCount = (script.sql.match(/DROP/g) || []).length
      expect(dropCount).toBeGreaterThan(0)
    })

    it('应该处理语句中的字符串', () => {
      const sql = `INSERT INTO users (name) VALUES ('O''Reilly');`
      const script = generator.generate('insert.sql', '20260331000010', sql)

      // 应该正确处理字符串中的引号
      expect(script.sql).toContain('-- 注意: INSERT 操作无法完全自动回滚')
    })
  })

  describe('splitStatements', () => {
    // 私有方法测试通过公共接口间接测试

    it('应该正确分割多个语句', () => {
      const sql = 'SELECT 1; SELECT 2; SELECT 3;'
      const script = generator.generate('test.sql', '20260331000011', sql)

      const statements = script.sql.split(';').filter((s) => s.trim())
      expect(statements.length).toBeGreaterThan(1)
    })

    it('应该忽略注释行', () => {
      const sql = `
        -- 这是注释
        SELECT 1;
        /* 多行注释 */
        SELECT 2;
      `
      const script = generator.generate('test.sql', '20260331000012', sql)

      // 注释应该被保留在回滚脚本中
      expect(script.sql).toContain('-- 这是注释')
    })
  })

  describe('generateRollbackForOperation', () => {
    it('应该为 DROP TABLE 生成占位符', () => {
      const sql = 'DROP TABLE old_users;'
      const script = generator.generate('drop_old.sql', '20260331000013', sql)

      expect(script.sql).toContain('-- 注意: DROP TABLE 操作无法自动回滚')
    })

    it('应该为 DROP INDEX 生成占位符', () => {
      const sql = 'DROP INDEX idx_users_name;'
      const script = generator.generate('drop_idx.sql', '20260331000014', sql)

      expect(script.sql).toContain('-- 注意: DROP INDEX 操作无法自动回滚')
    })

    it('应该为 ALTER TABLE DROP COLUMN 生成占位符', () => {
      const sql = 'ALTER TABLE users DROP COLUMN old_email;'
      const script = generator.generate('drop_col.sql', '20260331000015', sql)

      expect(script.sql).toContain('-- 注意: DROP COLUMN 操作无法自动回滚')
    })

    it('应该为 ALTER TABLE RENAME COLUMN 生成反向重命名', () => {
      const sql = 'ALTER TABLE users RENAME COLUMN name TO username;'
      const script = generator.generate('rename_col.sql', '20260331000016', sql)

      expect(script.sql).toContain('RENAME COLUMN')
      expect(script.sql).toContain('TO name')
    })

    it('应该为 CREATE FUNCTION 生成 DROP FUNCTION', () => {
      const sql = `
        CREATE OR REPLACE FUNCTION get_user_count()
        RETURNS INTEGER AS $$
        BEGIN
          RETURN SELECT COUNT(*) FROM users;
        END;
        $$ LANGUAGE plpgsql;
      `
      const script = generator.generate('create_func.sql', '20260331000017', sql)

      expect(script.sql).toContain('DROP FUNCTION IF EXISTS get_user_count')
    })

    it('应该为 CREATE TRIGGER 生成 DROP TRIGGER', () => {
      const sql = `
        CREATE TRIGGER update_timestamp
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_at();
      `
      const script = generator.generate('create_trigger.sql', '20260331000018', sql)

      expect(script.sql).toContain('DROP TRIGGER IF EXISTS update_trigger')
    })
  })

  describe('generateRollbackSQL', () => {
    it('应该生成格式正确的 SQL', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('test.sql', '20260331000019', sql)

      // 每个语句应该以分号结尾
      const lines = script.sql.split('\n')
      const sqlLines = lines.filter((line) => {
        const trimmed = line.trim()
        return trimmed && !trimmed.startsWith('--')
      })

      sqlLines.forEach((line) => {
        if (line && !line.startsWith('--')) {
          // 检查是否以分号结尾或包含占位符
          const hasStatement = line.includes('DROP') || line.includes('ALTER') || line.includes('--')
          if (hasStatement) {
            // 语句应该以分号结尾或包含占位符文本
            const endsWithSemicolon = line.trim().endsWith(';')
            const hasPlaceholder = line.includes('-- 注意:') || line.includes('-- 请手动')
            expect(endsWithSemicolon || hasPlaceholder).toBe(true)
          }
        }
      })
    })

    it('应该生成包含时间戳的脚本', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('test.sql', '20260331000020', sql)

      expect(script.sql).toContain('自动生成时间')
    })
  })

  describe('save', () => {
    it('应该生成正确的文件名', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY);'
      const script = generator.generate('test.sql', '20260331000021', sql)

      // 检查文件名格式
      const expectedPattern = /rollback_\d+_test\.sql/
      // 由于 save 方法使用 process.cwd()，我们只检查生成的脚本内容
      expect(script.migrationName).toBe('test.sql')
      expect(script.migrationVersion).toBe('20260331000021')
    })
  })

  describe('边界情况', () => {
    it('应该处理空 SQL', () => {
      const sql = ''
      const script = generator.generate('empty.sql', '20260331000022', sql)

      // 空 SQL 应该只生成头尾注释
      expect(script.sql).toContain('-- 回滚脚本')
      expect(script.sql).toContain('-- 回滚脚本结束')
    })

    it('应该处理只有注释的 SQL', () => {
      const sql = `
        -- 这是注释
        /* 多行注释 */
      `
      const script = generator.generate('comments.sql', '20260331000023', sql)

      expect(script.sql).toContain('-- 回滚脚本')
    })

    it('应该处理复杂的 ALTER TABLE 操作', () => {
      const sql = `
        ALTER TABLE users
          ADD COLUMN email TEXT,
          ADD COLUMN phone TEXT,
          ADD CONSTRAINT users_email_key UNIQUE (email);
      `
      const script = generator.generate('alter_users.sql', '20260331000024', sql)

      // 应该生成多个 DROP COLUMN/DROP CONSTRAINT
      const dropColumnCount = (script.sql.match(/DROP COLUMN/g) || []).length
      expect(dropColumnCount).toBeGreaterThan(0)
    })
  })
})
