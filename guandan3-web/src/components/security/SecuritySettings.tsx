'use client'

import { useState } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useSecurityValidation } from '@/lib/hooks/useSecurity'
import { useUserSecurity } from '@/lib/hooks/useSecurity'
import { useAuthStore } from '@/lib/store/auth'

export function SecuritySettings() {
  const { user } = useAuthStore()
  const { validateEmail, validateUsername, validatePassword } = useSecurityValidation()
  const { isLocked, remainingLockoutTime, hasSuspiciousActivity, getSecurityEvents } = useUserSecurity(user?.id)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState(user?.email || '')
  const [username, setUsername] = useState(user?.user_metadata?.username || '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (email && !validateEmail(email)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (username && !validateUsername(username)) {
      newErrors.username = '用户名格式不正确（3-20位字母数字下划线）'
    }

    if (newPassword) {
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0]
      }

      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      setErrors({ submit: '更新失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  const formatLockoutTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}分${seconds}秒`
  }

  const securityEvents = getSecurityEvents(10)

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">安全设置</h2>

        {isLocked && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">账户已锁定</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              由于多次登录失败，您的账户已被锁定。请等待 {formatLockoutTime(remainingLockoutTime)} 后重试。
            </p>
          </div>
        )}

        {hasSuspiciousActivity && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">检测到可疑活动</span>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              我们检测到您的账户存在可疑活动，建议您修改密码并检查安全设置。
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">设置已更新</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">邮箱地址</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              error={errors.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">用户名</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              error={errors.username}
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">修改密码</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">当前密码</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">新密码</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  error={errors.password}
                />
                <p className="text-xs text-gray-500 mt-1">
                  密码至少8位，包含大小写字母和数字
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">确认新密码</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存设置'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
              setCurrentPassword('')
              setNewPassword('')
              setConfirmPassword('')
              setErrors({})
              setSuccess(false)
            }}>
              取消
            </Button>
          </div>
        </form>
      </Card>

      {securityEvents.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近安全事件</h3>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div key={event.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{event.type}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleString('zh-CN')}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  严重程度: {event.severity}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
