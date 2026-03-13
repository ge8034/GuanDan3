import { useCallback, useEffect, useRef, useState } from 'react'

type ToastKind = 'success' | 'error' | 'info'

type ToastAction = {
  label: string
  onClick: () => void
}

type ToastState = {
  id: string
  message: string
  kind: ToastKind
  action?: ToastAction
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])
  const toastIdRef = useRef(0)
  const timersRef = useRef<Map<string, number>>(new Map())
  const lastActionAtRef = useRef(0)

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

  const showToast = useCallback((params: {
    message: string
    kind?: ToastKind
    timeoutMs?: number
    action?: ToastAction
  }) => {
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

