import CryptoJS from 'crypto-js'

import { logger } from '@/lib/utils/logger'
const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'guandan3-default-secret-key-2024'

export class DataSecurity {
  private static instance: DataSecurity

  private constructor() {}

  static getInstance(): DataSecurity {
    if (!DataSecurity.instance) {
      DataSecurity.instance = new DataSecurity()
    }
    return DataSecurity.instance
  }

  encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, SECRET_KEY).toString()
    } catch (error) {
      logger.error('Encryption error:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
      return bytes.toString(CryptoJS.enc.Utf8)
    } catch (error) {
      logger.error('Decryption error:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  encryptObject<T>(obj: T): string {
    try {
      const jsonString = JSON.stringify(obj)
      return this.encrypt(jsonString)
    } catch (error) {
      logger.error('Object encryption error:', error)
      throw new Error('Failed to encrypt object')
    }
  }

  decryptObject<T>(encryptedData: string): T | null {
    try {
      const jsonString = this.decrypt(encryptedData)
      return JSON.parse(jsonString) as T
    } catch (error) {
      logger.error('Object decryption error:', error)
      return null
    }
  }

  hash(data: string): string {
    try {
      return CryptoJS.SHA256(data).toString()
    } catch (error) {
      logger.error('Hash error:', error)
      throw new Error('Failed to hash data')
    }
  }

  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const randomValues = new Uint32Array(length)
    crypto.getRandomValues(randomValues)
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length]
    }
    
    return result
  }

  sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return ''
    }

    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/data:/gi, '')
      .replace(/alert\([^)]*\)/gi, '')
      .replace(/confirm\([^)]*\)/gi, '')
      .replace(/prompt\([^)]*\)/gi, '')
      .replace(/eval\([^)]*\)/gi, '')
      .replace(/document\./gi, '')
      .replace(/window\./gi, '')
      .replace(/\.innerHTML/gi, '')
      .replace(/\.outerHTML/gi, '')
      .trim()
  }

  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized: any = {}
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key]
        
        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeInput(value)
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value)
        } else {
          sanitized[key] = value
        }
      }
    }
    
    return sanitized
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
    return usernameRegex.test(username)
  }

  validatePassword(password: string): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('密码长度至少8位')
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母')
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母')
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('密码必须包含数字')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  maskSensitiveData(data: string, visibleChars: number = 4): string {
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length)
    }
    
    const visible = data.slice(0, visibleChars)
    const masked = '*'.repeat(data.length - visibleChars)
    return visible + masked
  }

  maskEmail(email: string): string {
    const [username, domain] = email.split('@')
    if (!username || !domain) {
      return email
    }
    
    const maskedUsername = this.maskSensitiveData(username, 2)
    return `${maskedUsername}@${domain}`
  }

  maskPhoneNumber(phone: string): string {
    if (phone.length < 7) {
      return '*'.repeat(phone.length)
    }
    
    const visible = phone.slice(0, 3)
    const masked = '*'.repeat(phone.length - 7)
    const end = phone.slice(-4)
    return visible + masked + end
  }

  generateChecksum(data: string): string {
    return this.hash(data).slice(0, 16)
  }

  verifyChecksum(data: string, checksum: string): boolean {
    const calculatedChecksum = this.generateChecksum(data)
    return calculatedChecksum === checksum
  }

  encodeBase64(data: string): string {
    try {
      return btoa(unescape(encodeURIComponent(data)))
    } catch (error) {
      logger.error('Base64 encoding error:', error)
      throw new Error('Failed to encode base64')
    }
  }

  decodeBase64(encodedData: string): string {
    try {
      return decodeURIComponent(escape(atob(encodedData)))
    } catch (error) {
      logger.error('Base64 decoding error:', error)
      throw new Error('Failed to decode base64')
    }
  }

  generateNonce(): string {
    return this.generateSecureToken(16)
  }

  generateTimestamp(): number {
    return Date.now()
  }

  isTimestampValid(timestamp: number, maxAge: number = 300000): boolean {
    const now = Date.now()
    const age = now - timestamp
    return age >= 0 && age <= maxAge
  }
}

export const dataSecurity = DataSecurity.getInstance()
