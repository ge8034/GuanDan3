import { dataSecurity } from './data-security'

interface SecurityConfig {
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  passwordExpiry: number
  requireMFA: boolean
}

interface LoginAttempt {
  timestamp: number
  ip: string
  success: boolean
}

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'password_change' | 'account_lock' | 'suspicious_activity'
  timestamp: number
  userId: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class UserSecurity {
  private static instance: UserSecurity
  private loginAttempts: Map<string, LoginAttempt[]> = new Map()
  private lockedAccounts: Map<string, number> = new Map()
  private securityEvents: SecurityEvent[] = []
  private config: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    sessionTimeout: 30 * 60 * 1000,
    passwordExpiry: 90 * 24 * 60 * 60 * 1000,
    requireMFA: false
  }

  private constructor() {
    this.loadSecurityState()
  }

  static getInstance(): UserSecurity {
    if (!UserSecurity.instance) {
      UserSecurity.instance = new UserSecurity()
    }
    return UserSecurity.instance
  }

  private loadSecurityState(): void {
    try {
      const stored = localStorage.getItem('user-security-state')
      if (stored) {
        const state = JSON.parse(stored)
        this.loginAttempts = new Map(state.loginAttempts || [])
        this.lockedAccounts = new Map(state.lockedAccounts || [])
        this.securityEvents = state.securityEvents || []
      }
    } catch (error) {
      console.error('Failed to load security state:', error)
    }
  }

  private saveSecurityState(): void {
    try {
      const state = {
        loginAttempts: Array.from(this.loginAttempts.entries()),
        lockedAccounts: Array.from(this.lockedAccounts.entries()),
        securityEvents: this.securityEvents
      }
      localStorage.setItem('user-security-state', JSON.stringify(state))
    } catch (error) {
      console.error('Failed to save security state:', error)
    }
  }

  recordLoginAttempt(userId: string, ip: string, success: boolean): void {
    const attempts = this.loginAttempts.get(userId) || []
    const now = Date.now()

    attempts.push({
      timestamp: now,
      ip,
      success
    })

    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < 15 * 60 * 1000
    )

    this.loginAttempts.set(userId, recentAttempts)

    // 记录登录尝试为安全事件
    this.logSecurityEvent({
      id: dataSecurity.generateNonce(),
      type: success ? 'login' : 'suspicious_activity',
      timestamp: now,
      userId,
      details: {
        ip,
        success,
        recentFailedAttempts: recentAttempts.filter(a => !a.success).length
      },
      severity: success ? 'low' : 'medium'
    })

    if (!success) {
      const failedAttempts = recentAttempts.filter(a => !a.success).length
      if (failedAttempts >= this.config.maxLoginAttempts) {
        this.lockAccount(userId)
      }
    }

    this.saveSecurityState()
  }

  isAccountLocked(userId: string): boolean {
    const lockTime = this.lockedAccounts.get(userId)
    if (!lockTime) return false

    const now = Date.now()
    if (now - lockTime > this.config.lockoutDuration) {
      this.lockedAccounts.delete(userId)
      this.saveSecurityState()
      return false
    }

    return true
  }

  private lockAccount(userId: string): void {
    this.lockedAccounts.set(userId, Date.now())
    this.logSecurityEvent({
      id: dataSecurity.generateNonce(),
      type: 'account_lock',
      timestamp: Date.now(),
      userId,
      details: { reason: 'too_many_failed_attempts' },
      severity: 'high'
    })
    this.saveSecurityState()
  }

  unlockAccount(userId: string): void {
    this.lockedAccounts.delete(userId)
    this.loginAttempts.delete(userId)
    this.saveSecurityState()
  }

  getRemainingLockoutTime(userId: string): number {
    const lockTime = this.lockedAccounts.get(userId)
    if (!lockTime) return 0

    const now = Date.now()
    const elapsed = now - lockTime
    const remaining = this.config.lockoutDuration - elapsed

    return Math.max(0, remaining)
  }

  validateSession(userId: string, sessionTimestamp: number): boolean {
    const now = Date.now()
    const age = now - sessionTimestamp
    return age < this.config.sessionTimeout
  }

  isPasswordExpired(lastChanged: number): boolean {
    const now = Date.now()
    const age = now - lastChanged
    return age > this.config.passwordExpiry
  }

  checkSuspiciousActivity(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId) || []
    const now = Date.now()

    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < 60 * 60 * 1000
    )

    const uniqueIPs = new Set(recentAttempts.map(a => a.ip))
    const failedAttempts = recentAttempts.filter(a => !a.success).length

    if (uniqueIPs.size > 5) {
      this.logSecurityEvent({
        id: dataSecurity.generateNonce(),
        type: 'suspicious_activity',
        timestamp: now,
        userId,
        details: { reason: 'multiple_ips', ipCount: uniqueIPs.size },
        severity: 'high'
      })
      return true
    }

    if (failedAttempts > 10) {
      this.logSecurityEvent({
        id: dataSecurity.generateNonce(),
        type: 'suspicious_activity',
        timestamp: now,
        userId,
        details: { reason: 'excessive_failed_attempts', count: failedAttempts },
        severity: 'medium'
      })
      return true
    }

    return false
  }

  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event)

    const maxEvents = 1000
    if (this.securityEvents.length > maxEvents) {
      this.securityEvents = this.securityEvents.slice(-maxEvents)
    }

    this.saveSecurityState()
  }

  getSecurityEvents(userId: string, limit: number = 50): SecurityEvent[] {
    return this.securityEvents
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  getAllSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  clearSecurityEvents(userId?: string): void {
    if (userId) {
      this.securityEvents = this.securityEvents.filter(e => e.userId !== userId)
    } else {
      this.securityEvents = []
    }
    this.saveSecurityState()
  }

  updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): SecurityConfig {
    return { ...this.config }
  }

  generateSecurityReport(): {
    totalEvents: number
    criticalEvents: number
    highSeverityEvents: number
    lockedAccounts: number
    recentSuspiciousActivity: number
  } {
    const now = Date.now()
    const recentEvents = this.securityEvents.filter(
      e => now - e.timestamp < 24 * 60 * 60 * 1000
    )

    return {
      totalEvents: this.securityEvents.length,
      criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
      highSeverityEvents: this.securityEvents.filter(e => e.severity === 'high').length,
      lockedAccounts: this.lockedAccounts.size,
      recentSuspiciousActivity: recentEvents.filter(e => e.type === 'suspicious_activity').length
    }
  }

  validateUserInput(input: string, type: 'username' | 'email' | 'password' | 'general'): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!input || input.trim().length === 0) {
      errors.push('输入不能为空')
      return { isValid: false, errors }
    }

    const sanitized = dataSecurity.sanitizeInput(input)
    if (sanitized !== input) {
      errors.push('输入包含非法字符')
    }

    switch (type) {
      case 'username':
        if (!dataSecurity.validateUsername(input)) {
          errors.push('用户名格式不正确（3-20位字母数字下划线）')
        }
        break
      case 'email':
        if (!dataSecurity.validateEmail(input)) {
          errors.push('邮箱格式不正确')
        }
        break
      case 'password':
        const passwordValidation = dataSecurity.validatePassword(input)
        if (!passwordValidation.isValid) {
          errors.push(...passwordValidation.errors)
        }
        break
      case 'general':
        if (input.length > 1000) {
          errors.push('输入过长')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  rateLimitCheck(userId: string, action: string, limit: number = 10, window: number = 60000): boolean {
    const key = `${userId}:${action}`
    const attempts = this.loginAttempts.get(key) || []
    const now = Date.now()

    const recentAttempts = attempts.filter(
      attempt => now - attempt.timestamp < window
    )

    if (recentAttempts.length >= limit) {
      return false
    }

    recentAttempts.push({
      timestamp: now,
      ip: 'system',
      success: true
    })

    this.loginAttempts.set(key, recentAttempts)
    this.saveSecurityState()

    return true
  }

  cleanupOldData(): void {
    const now = Date.now()
    const maxAge = 30 * 24 * 60 * 60 * 1000

    Array.from(this.loginAttempts.entries()).forEach(([key, attempts]) => {
      const recentAttempts = attempts.filter(
        (attempt: LoginAttempt) => now - attempt.timestamp < maxAge
      )
      if (recentAttempts.length === 0) {
        this.loginAttempts.delete(key)
      } else {
        this.loginAttempts.set(key, recentAttempts)
      }
    })

    Array.from(this.lockedAccounts.entries()).forEach(([userId, lockTime]) => {
      if (now - lockTime > this.config.lockoutDuration) {
        this.lockedAccounts.delete(userId)
      }
    })

    this.securityEvents = this.securityEvents.filter(
      event => now - event.timestamp < maxAge
    )

    this.saveSecurityState()
  }
}

export const userSecurity = UserSecurity.getInstance()
