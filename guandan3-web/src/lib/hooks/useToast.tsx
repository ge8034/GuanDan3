import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Toast 消息类型
 */
type ToastKind = 'success' | 'error' | 'info'

/**
 * Toast 操作按钮配置
 */
type ToastAction = {
  /** 按钮显示文本 */
  label: string
  /** 点击回调函数 */
  onClick: () => void
}

/**
 * Toast 状态
 */
type ToastState = {
  /** 唯一标识符 */
  id: string
  /** 显示的消息内容 */
  message: string
  /** 消息类型 */
  kind: ToastKind
  /** 可选的操作按钮 */
  action?: ToastAction
}

/**
 * Toast 显示参数
 */
type ShowToastParams = {
  /** 要显示的消息内容 */
  message: string
  /** 消息类型，默认 'error' */
  kind?: ToastKind
  /** 自动关闭时间（毫秒），默认 2500ms */
  timeoutMs?: number
  /** 可选的操作按钮 */
  action?: ToastAction
}

/**
 * Toast 通知 Hook
 *
 * 提供全局 Toast 通知功能，支持成功、错误、信息三种类型，
 * 可配置自动关闭时间和操作按钮。
 *
 * @returns Toast 操作方法和视图组件
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast, hideToast, toastView } = useToast()
 *
 *   const handleSuccess = () => {
 *     showToast({
 *       message: '操作成功！',
 *       kind: 'success'
 *     })
 *   }
 *
 *   const handleError = (error: Error) => {
 *     showToast({
 *       message: error.message,
 *       kind: 'error',
 *       timeoutMs: 5000,
 *       action: {
 *         label: '重试',
 *         onClick: () => retry()
 *       }
 *     })
 *   }
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>显示成功提示</button>
 *       {toastView}
 *     </div>
 *   )
 * }
 * ```
 *
 * @remarks
 * - 最多同时显示 3 个 Toast
 * - 自动关闭，默认 2.5 秒
 * - 操作按钮有 1 秒防抖保护
 * - 组件卸载时自动清理所有定时器
 */
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const toastIdRef = useRef(0)
  const timersRef = useRef<Map<string, number>>(new Map())
  const lastActionAtRef = useRef(0)

  /**
   * 隐藏 Toast
   *
   * @param id - Toast ID，不传则隐藏所有
   */
  const hideToast = useCallback((id?: string) => {
    if (!id) {
      timersRef.current.forEach(t => window.clearTimeout(t))
      timersRef.current.clear()
      setToasts([])
      return
    }

    const t = timersRef.current.get(id)
    if (t !== undefined) {
      window.clearTimeout(t)
      timersRef.current.delete(id)
    }
    setToasts(prev => prev.filter(x => x.id !== id))
  }, [])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(t => window.clearTimeout(t))
      timers.clear()
    }
  }, [])

  /**
   * 显示 Toast
   *
   * @param params - Toast 配置参数
   */
  const showToast = useCallback((params: ShowToastParams) => {
    const kind = params.kind ?? 'error'
    const timeoutMs = params.timeoutMs ?? 2500
    toastIdRef.current += 1
    const id = `${Date.now()}-${toastIdRef.current}`

    const toast: ToastState = { id, message: params.message, kind, action: params.action }
    setToasts(prev => {
      const next = [...prev, toast]
      const keep = next.slice(-3)
      const keepIds = new Set(keep.map(t => t.id))
      next.forEach(t => {
        if (!keepIds.has(t.id)) {
          const timer = timersRef.current.get(t.id)
          if (timer !== undefined) {
            window.clearTimeout(timer)
            timersRef.current.delete(t.id)
          }
        }
      })
      return keep
    })

    const timer = window.setTimeout(() => {
      hideToast(id)
    }, timeoutMs)
    timersRef.current.set(id, timer)
  }, [hideToast])

  const toastView = toasts.length ? (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map(toast => (
      <div
        key={toast.id}
        data-testid="toast-item"
        className={`px-4 py-3 rounded shadow-lg text-sm ${
          toast.kind === 'success'
            ? 'bg-emerald-600 text-white'
            : toast.kind === 'info'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-900 text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="max-w-[22rem] break-words">{toast.message}</div>
          {toast.action && (
            <button
              data-testid="toast-action"
              onClick={() => {
                const now = Date.now()
                if (now - lastActionAtRef.current < 1000) return
                lastActionAtRef.current = now
                toast.action?.onClick()
                hideToast(toast.id)
              }}
              className="shrink-0 border border-white/30 px-2 py-1 rounded hover:bg-white/10 transition"
            >
              {toast.action.label}
            </button>
          )}
          <button
            data-testid="toast-close"
            onClick={() => hideToast(toast.id)}
            className="shrink-0 border border-white/30 px-2 py-1 rounded hover:bg-white/10 transition"
          >
            关闭
          </button>
        </div>
      </div>
      ))}
    </div>
  ) : null

  return { showToast, hideToast, toastView }
}
