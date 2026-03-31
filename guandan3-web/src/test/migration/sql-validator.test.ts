/**
 * SQL 验证器单元测试
 */

import { describe, it, expect } from 'vitest'
import { SQLValidator } from '../migration-validator'

describe('SQLValidator', () => {
  const validator = new SQLValidator()

  describe('validate', () => {
    it('应该检测 DROP TABLE 操作', () => {
      const sql = 'DROP TABLE users;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.dangerousPatterns.some((p) => p.type === 'DROP_TABLE')).toBe(true)
    })

    it('应该检测 TRUNCATE 操作', () => {
      const sql = 'TRUNCATE TABLE sessions;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.dangerousPatterns.some((p) => p.type === 'TRUNCATE')).toBe(true)
    })

    it('应该检测无条件 DELETE', () => {
      const sql = 'DELETE FROM logs;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.dangerousPatterns.some((p) => p.type === 'UNCONDITIONAL_DELETE')).toBe(true)
    })

    it('应该检测无条件 UPDATE', () => {
      const sql = 'UPDATE users SET active = true;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('应该检测 SELECT *', () => {
      const sql = 'SELECT * FROM users;'
      const result = validator.validate(sql)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.dangerousPatterns.some((p) => p.type === 'FULL_TABLE_SCAN')).toBe(true)
    })

    it('应该检测未闭合的单引号', () => {
      const sql = "SELECT * FROM users WHERE name = 'test;"
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.includes('单引号'))).toBe(true)
    })

    it('应该识别 CREATE TABLE 操作', () => {
      const sql = 'CREATE TABLE users (id SERIAL PRIMARY KEY, name TEXT);'
      const result = validator.validate(sql)

      expect(result.operations).toContain('CREATE_TABLE')
    })

    it('应该识别 CREATE INDEX 操作', () => {
      const sql = 'CREATE INDEX idx_users_name ON users(name);'
      const result = validator.validate(sql)

      expect(result.operations).toContain('CREATE_INDEX')
    })

    it('应该识别 ALTER TABLE 操作', () => {
      const sql = 'ALTER TABLE users ADD COLUMN email TEXT;'
      const result = validator.validate(sql)

      expect(result.operations).toContain('ALTER_TABLE')
    })

    it('应该识别 GRANT 操作', () => {
      const sql = 'GRANT SELECT ON users TO app_user;'
      const result = validator.validate(sql)

      expect(result.operations).toContain('GRANT')
    })

    it('应该验证安全的 SQL', () => {
      const sql = `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE
        );
        CREATE INDEX idx_users_name ON users(name);
        GRANT SELECT ON users TO app_user;
      `
      const result = validator.validate(sql)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.operations).toContain('CREATE_TABLE')
      expect(result.operations).toContain('CREATE_INDEX')
      expect(result.operations).toContain('GRANT')
    })

    it('应该生成正确的摘要', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        DROP TABLE temp_table;
      `
      const result = validator.validate(sql)

      expect(result.summary).toContain('2 种操作类型')
    })
  })

  describe('checkSyntax', () => {
    // 私有方法测试通过公共接口间接测试

    it('应该检测 FROM 后缺少表名', () => {
      const sql = 'SELECT * FROM;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
    })

    it('应该检测 WHERE 后缺少条件', () => {
      const sql = 'SELECT * FROM users WHERE;'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
    })

    it('应该检测 INSERT INTO 后缺少表名', () => {
      const sql = 'INSERT INTO VALUES (1, 2);'
      const result = validator.validate(sql)

      expect(result.isValid).toBe(false)
    })
  })

  describe('复杂 SQL 场景', () => {
    it('应该处理多语句 SQL', () => {
      const sql = `
        -- 创建用户表
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        );

        -- 创建索引
        CREATE INDEX idx_users_name ON users(name);

        -- 授权
        GRANT SELECT ON users TO app_user;
      `
      const result = validator.validate(sql)

      expect(result.isValid).toBe(true)
      expect(result.operations).toContain('CREATE_TABLE')
      expect(result.operations).toContain('CREATE_INDEX')
      expect(result.operations).toContain('GRANT')
    })

    it('应该处理带注释的 SQL', () => {
      const sql = `
        -- 这是注释
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
        /* 多行注释 */
        CREATE INDEX idx_users_id ON users(id);
      `
      const result = validator.validate(sql)

      expect(result.isValid).toBe(true)
    })

    it('应该处理函数定义', () => {
      const sql = `
        CREATE OR REPLACE FUNCTION get_user_count()
        RETURNS INTEGER AS $$
        BEGIN
          RETURN SELECT COUNT(*) FROM users;
        END;
        $$ LANGUAGE plpgsql;
      `
      const result = validator.validate(sql)

      expect(result.operations).toContain('CREATE_FUNCTION')
    })
  })
})
