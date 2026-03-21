import { useState, useEffect, useCallback } from 'react'
import { dataSecurity } from '@/lib/security/data-security'
import { userSecurity } from '@/lib/security/user-security'

export function useDataSecurity() {
  const encrypt = useCallback((data: string) => {
    return dataSecurity.encrypt(data)
  }, [])

  const decrypt = useCallback((encryptedData: string) => {
    return dataSecurity.decrypt(encryptedData)
  }, [])

  const encryptObject = useCallback(<T,>(obj: T): string => {
    return dataSecurity.encryptObject(obj)
  }, [])

  const decryptObject = useCallback(<T,>(encryptedData: string): T | null => {
    return dataSecurity.decryptObject<T>(encryptedData)
  }, [])

  const hash = useCallback((data: string) => {
    return dataSecurity.hash(data)
  }, [])

  const sanitizeInput = useCallback((input: string) => {
    return dataSecurity.sanitizeInput(input)
  }, [])

  const sanitizeObject = useCallback(<T extends Record<string, any>>(obj: T): T => {
    return dataSecurity.sanitizeObject(obj)
  }, [])

  const maskEmail = useCallback((email: string) => {
    return dataSecurity.maskEmail(email)
  }, [])

  const maskPhoneNumber = useCallback((phone: string) => {
    return dataSecurity.maskPhoneNumber(phone)
  }, [])

  return {
    encrypt,
    decrypt,
    encryptObject,
    decryptObject,
    hash,
    sanitizeInput,
    sanitizeObject,
    maskEmail,
    maskPhoneNumber
  }
}

export function useUserSecurity(userId?: string) {
  const [isLocked, setIsLocked] = useState(false)
  const [remainingLockoutTime, setRemainingLockoutTime] = useState(0)
  const [hasSuspiciousActivity, setHasSuspiciousActivity] = useState(false)

  useEffect(() => {
    if (!userId) return

    const checkStatus = () => {
      const locked = userSecurity.isAccountLocked(userId)
      setIsLocked(locked)
      setRemainingLockoutTime(userSecurity.getRemainingLockoutTime(userId))
      setHasSuspiciousActivity(userSecurity.checkSuspiciousActivity(userId))
    }

    checkStatus()
    const interval = setInterval(checkStatus, 5000)

    return () => clearInterval(interval)
  }, [userId])

  const recordLoginAttempt = useCallback((ip: string, success: boolean) => {
    if (!userId) return
    userSecurity.recordLoginAttempt(userId, ip, success)
  }, [userId])

  const validateSession = useCallback((sessionTimestamp: number) => {
    if (!userId) return false
    return userSecurity.validateSession(userId, sessionTimestamp)
  }, [userId])

  const validateInput = useCallback((input: string, type: 'username' | 'email' | 'password' | 'general') => {
    return userSecurity.validateUserInput(input, type)
  }, [])

  const rateLimitCheck = useCallback((action: string, limit?: number, window?: number) => {
    if (!userId) return false
    return userSecurity.rateLimitCheck(userId, action, limit, window)
  }, [userId])

  const getSecurityEvents = useCallback((limit?: number) => {
    if (!userId) return []
    return userSecurity.getSecurityEvents(userId, limit)
  }, [userId])

  return {
    isLocked,
    remainingLockoutTime,
    hasSuspiciousActivity,
    recordLoginAttempt,
    validateSession,
    validateInput,
    rateLimitCheck,
    getSecurityEvents
  }
}

export function useSecureStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      if (item) {
        const decrypted = dataSecurity.decrypt(item)
        return JSON.parse(decrypted) as T
      }
      return initialValue
    } catch (error) {
      console.error('Error loading from secure storage:', error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      const encrypted = dataSecurity.encrypt(JSON.stringify(valueToStore))
      localStorage.setItem(key, encrypted)
    } catch (error) {
      console.error('Error saving to secure storage:', error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.error('Error removing from secure storage:', error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue] as const
}

export function useSecurityValidation() {
  const validateEmail = useCallback((email: string) => {
    return dataSecurity.validateEmail(email)
  }, [])

  const validateUsername = useCallback((username: string) => {
    return dataSecurity.validateUsername(username)
  }, [])

  const validatePassword = useCallback((password: string) => {
    return dataSecurity.validatePassword(password)
  }, [])

  const validateInput = useCallback((input: string, type: 'username' | 'email' | 'password' | 'general') => {
    return userSecurity.validateUserInput(input, type)
  }, [])

  return {
    validateEmail,
    validateUsername,
    validatePassword,
    validateInput
  }
}

export function useSecurityReport() {
  const [report, setReport] = useState(userSecurity.generateSecurityReport())

  const refreshReport = useCallback(() => {
    setReport(userSecurity.generateSecurityReport())
  }, [])

  const getAllSecurityEvents = useCallback((limit?: number) => {
    return userSecurity.getAllSecurityEvents(limit)
  }, [])

  const clearSecurityEvents = useCallback((userId?: string) => {
    userSecurity.clearSecurityEvents(userId)
    refreshReport()
  }, [refreshReport])

  const cleanupOldData = useCallback(() => {
    userSecurity.cleanupOldData()
    refreshReport()
  }, [refreshReport])

  return {
    report,
    refreshReport,
    getAllSecurityEvents,
    clearSecurityEvents,
    cleanupOldData
  }
}
