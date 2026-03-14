export type ThrottledFn<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => void) & {
  cancel: () => void
}

export const throttle = <T extends (...args: any[]) => any>(fn: T, waitMs: number): ThrottledFn<T> => {
  let lastExecAt = 0
  let timeout: ReturnType<typeof setTimeout> | null = null
  let trailingPending = false
  let lastArgs: Parameters<T> | null = null

  const cancel = () => {
    if (timeout) clearTimeout(timeout)
    timeout = null
    trailingPending = false
    lastArgs = null
  }

  const wrapped = ((...args: Parameters<T>) => {
    const now = Date.now()
    lastArgs = args
    const elapsed = now - lastExecAt

    if (lastExecAt === 0 || elapsed >= waitMs) {
      lastExecAt = now
      trailingPending = false
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      fn(...args)
      return
    }

    trailingPending = true
    if (timeout) return

    timeout = setTimeout(() => {
      timeout = null
      if (!trailingPending || !lastArgs) return
      trailingPending = false
      lastExecAt = Date.now()
      fn(...lastArgs)
    }, waitMs - elapsed)
  }) as ThrottledFn<T>

  wrapped.cancel = cancel
  return wrapped
}

