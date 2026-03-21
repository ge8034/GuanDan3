import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { dataSecurity } from '@/lib/security/data-security'
import { userSecurity } from '@/lib/security/user-security'

describe('安全系统集成测试', () => {
  beforeEach(() => {
    userSecurity.clearSecurityEvents()
  })

  afterEach(() => {
    userSecurity.clearSecurityEvents()
  })

  describe('数据安全集成', () => {
    it('应该能够加密和解密数据', () => {
      const originalData = 'sensitive-information'
      const encrypted = dataSecurity.encrypt(originalData)
      const decrypted = dataSecurity.decrypt(encrypted)

      expect(encrypted).not.toBe(originalData)
      expect(decrypted).toBe(originalData)
    })

    it('应该能够加密和解密对象', () => {
      const originalObject = {
        id: 'user-123',
        email: 'test@example.com',
        metadata: { role: 'admin' }
      }

      const encrypted = dataSecurity.encryptObject(originalObject)
      const decrypted = dataSecurity.decryptObject<typeof originalObject>(encrypted)

      expect(encrypted).not.toBe(JSON.stringify(originalObject))
      expect(decrypted).toEqual(originalObject)
    })

    it('应该能够生成和验证哈希', () => {
      const data = 'test-data'
      const hash1 = dataSecurity.hash(data)
      const hash2 = dataSecurity.hash(data)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
    })

    it('应该能够生成安全令牌', () => {
      const token1 = dataSecurity.generateSecureToken(32)
      const token2 = dataSecurity.generateSecureToken(32)

      expect(token1).toHaveLength(32)
      expect(token2).toHaveLength(32)
      expect(token1).not.toBe(token2)
    })

    it('应该能够清理输入', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const sanitized = dataSecurity.sanitizeInput(maliciousInput)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert')
    })

    it('应该能够清理对象', () => {
      const maliciousObject = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        nested: {
          value: 'javascript:alert(1)'
        }
      }

      const sanitized = dataSecurity.sanitizeObject(maliciousObject)

      expect(sanitized.name).not.toContain('<script>')
      expect(sanitized.nested.value).not.toContain('javascript:')
    })

    it('应该能够验证邮箱', () => {
      expect(dataSecurity.validateEmail('test@example.com')).toBe(true)
      expect(dataSecurity.validateEmail('invalid-email')).toBe(false)
      expect(dataSecurity.validateEmail('')).toBe(false)
    })

    it('应该能够验证用户名', () => {
      expect(dataSecurity.validateUsername('validuser123')).toBe(true)
      expect(dataSecurity.validateUsername('invalid user')).toBe(false)
      expect(dataSecurity.validateUsername('')).toBe(false)
    })

    it('应该能够验证密码', () => {
      const validPassword = 'SecurePass123'
      const invalidPassword = 'weak'

      const validResult = dataSecurity.validatePassword(validPassword)
      const invalidResult = dataSecurity.validatePassword(invalidPassword)

      expect(validResult.isValid).toBe(true)
      expect(invalidResult.isValid).toBe(false)
    })

    it('应该能够掩码敏感数据', () => {
      const email = 'testuser@example.com'
      const masked = dataSecurity.maskEmail(email)

      expect(masked).toContain('@')
      expect(masked).toContain('*')
      expect(masked).not.toBe(email)
    })

    it('应该能够生成和验证校验和', () => {
      const data = 'test-data'
      const checksum = dataSecurity.generateChecksum(data)
      const isValid = dataSecurity.verifyChecksum(data, checksum)

      expect(checksum).toBeDefined()
      expect(isValid).toBe(true)
    })
  })

  describe('用户安全集成', () => {
    it('应该能够记录登录尝试', () => {
      const userId = 'test-user-1'
      const ip = '192.168.1.1'

      userSecurity.recordLoginAttempt(userId, ip, true)

      const events = userSecurity.getSecurityEvents(userId)
      expect(events.length).toBeGreaterThan(0)
    })

    it('应该能够锁定账户', () => {
      const userId = 'test-user-2'
      const ip = '192.168.1.1'

      for (let i = 0; i < 6; i++) {
        userSecurity.recordLoginAttempt(userId, ip, false)
      }

      expect(userSecurity.isAccountLocked(userId)).toBe(true)
    })

    it('应该能够解锁账户', () => {
      const userId = 'test-user-3'
      const ip = '192.168.1.1'

      for (let i = 0; i < 6; i++) {
        userSecurity.recordLoginAttempt(userId, ip, false)
      }

      expect(userSecurity.isAccountLocked(userId)).toBe(true)

      userSecurity.unlockAccount(userId)
      expect(userSecurity.isAccountLocked(userId)).toBe(false)
    })

    it('应该能够验证会话', () => {
      const userId = 'test-user-4'
      const sessionTimestamp = Date.now()

      const isValid = userSecurity.validateSession(userId, sessionTimestamp)

      expect(isValid).toBe(true)
    })

    it('应该能够检测可疑活动', () => {
      const userId = 'test-user-5'

      for (let i = 0; i < 6; i++) {
        userSecurity.recordLoginAttempt(userId, `192.168.1.${i}`, false)
      }

      const hasSuspiciousActivity = userSecurity.checkSuspiciousActivity(userId)

      expect(hasSuspiciousActivity).toBe(true)
    })

    it('应该能够进行速率限制', () => {
      const userId = 'test-user-6'
      const action = 'api-call'

      const results = []
      for (let i = 0; i < 15; i++) {
        results.push(userSecurity.rateLimitCheck(userId, action, 10, 60000))
      }

      const allowedCount = results.filter(r => r).length
      expect(allowedCount).toBeLessThanOrEqual(10)
    })

    it('应该能够验证用户输入', () => {
      const validEmail = 'test@example.com'
      const invalidEmail = 'invalid'

      const validResult = userSecurity.validateUserInput(validEmail, 'email')
      const invalidResult = userSecurity.validateUserInput(invalidEmail, 'email')

      expect(validResult.isValid).toBe(true)
      expect(invalidResult.isValid).toBe(false)
    })

    it('应该能够生成安全报告', () => {
      const report = userSecurity.generateSecurityReport()

      expect(report).toBeDefined()
      expect(report.totalEvents).toBeGreaterThanOrEqual(0)
      expect(report.criticalEvents).toBeGreaterThanOrEqual(0)
      expect(report.highSeverityEvents).toBeGreaterThanOrEqual(0)
      expect(report.lockedAccounts).toBeGreaterThanOrEqual(0)
    })

    it('应该能够清理旧数据', () => {
      const userId = 'test-user-7'
      const ip = '192.168.1.1'

      userSecurity.recordLoginAttempt(userId, ip, true)
      userSecurity.cleanupOldData()

      const events = userSecurity.getSecurityEvents(userId)
      expect(events).toBeDefined()
    })
  })

  describe('安全事件集成', () => {
    it('应该能够记录安全事件', () => {
      const userId = 'test-user-8'
      userSecurity.recordLoginAttempt(userId, '192.168.1.1', true)

      const events = userSecurity.getSecurityEvents(userId)
      expect(events.length).toBeGreaterThan(0)
    })

    it('应该能够获取所有安全事件', () => {
      const userId1 = 'test-user-9'
      const userId2 = 'test-user-10'

      userSecurity.recordLoginAttempt(userId1, '192.168.1.1', true)
      userSecurity.recordLoginAttempt(userId2, '192.168.1.2', true)

      const allEvents = userSecurity.getAllSecurityEvents(100)
      expect(allEvents.length).toBeGreaterThanOrEqual(2)
    })

    it('应该能够清除安全事件', () => {
      const userId = 'test-user-11'
      userSecurity.recordLoginAttempt(userId, '192.168.1.1', true)

      userSecurity.clearSecurityEvents(userId)

      const events = userSecurity.getSecurityEvents(userId)
      expect(events.length).toBe(0)
    })
  })

  describe('安全配置集成', () => {
    it('应该能够更新安全配置', () => {
      const newConfig = {
        maxLoginAttempts: 10,
        lockoutDuration: 30 * 60 * 1000,
        sessionTimeout: 60 * 60 * 1000
      }

      userSecurity.updateConfig(newConfig)
      const config = userSecurity.getConfig()

      expect(config.maxLoginAttempts).toBe(10)
      expect(config.lockoutDuration).toBe(30 * 60 * 1000)
      expect(config.sessionTimeout).toBe(60 * 60 * 1000)
    })

    it('应该能够获取安全配置', () => {
      const config = userSecurity.getConfig()

      expect(config).toBeDefined()
      expect(config.maxLoginAttempts).toBeGreaterThan(0)
      expect(config.lockoutDuration).toBeGreaterThan(0)
      expect(config.sessionTimeout).toBeGreaterThan(0)
    })
  })

  describe('并发安全集成', () => {
    it('应该能够处理并发登录尝试', async () => {
      const userId = 'test-user-12'
      const promises = []

      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            userSecurity.recordLoginAttempt(userId, `192.168.1.${i}`, i % 2 === 0)
          })
        )
      }

      await Promise.all(promises)

      const events = userSecurity.getSecurityEvents(userId)
      expect(events.length).toBe(10)
    })

    it('应该能够处理并发安全事件记录', async () => {
      const promises = []

      for (let i = 0; i < 20; i++) {
        promises.push(
          Promise.resolve().then(() => {
            userSecurity.recordLoginAttempt(`user-${i}`, '192.168.1.1', true)
          })
        )
      }

      await Promise.all(promises)

      const allEvents = userSecurity.getAllSecurityEvents(100)
      expect(allEvents.length).toBeGreaterThanOrEqual(20)
    })
  })

  describe('错误处理集成', () => {
    it('应该能够处理加密错误', () => {
      expect(() => {
        dataSecurity.encrypt('')
      }).not.toThrow()
    })

    it('应该能够处理解密错误', () => {
      const result = dataSecurity.decrypt('invalid-encrypted-data')
      expect(result).toBe('')
    })

    it('应该能够处理无效输入验证', () => {
      const result = userSecurity.validateUserInput('', 'email')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
