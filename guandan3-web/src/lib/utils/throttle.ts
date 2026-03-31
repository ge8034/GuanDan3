/**
 * 节流函数类型
 *
 * 带有取消功能的节流函数
 */
export type ThrottledFn<T extends (...args: any[]) => any> = ((...args: Parameters<T>) => void) & {
  /** 取消待执行的调用 */
  cancel: () => void
}

/**
 * 创建节流函数
 *
 * 节流（throttle）确保函数在指定时间间隔内最多执行一次。
 * 与防抖（debounce）不同，节流会立即执行第一次调用，
 * 然后按照指定间隔执行后续调用。
 *
 * @param fn - 需要节流的函数
 * @param waitMs - 节流间隔时间（毫秒）
 * @returns 带有 cancel 方法的节流函数
 *
 * @example
 * ```ts
 * // 窗口滚动事件节流
 * const handleScroll = throttle(() => {
 *   console.log('Scroll event handled')
 * }, 200)
 *
 * window.addEventListener('scroll', handleScroll)
 *
 * // 清理时取消
 * handleScroll.cancel()
 * ```
 *
 * @example
 * ```ts
 * // React 组件中使用
 * const handleChange = throttle((value: string) => {
 *   saveToServer(value)
 * }, 1000)
 *
 * // 组件卸载时清理
 * useEffect(() => {
 *   return () => handleChange.cancel()
 * }, [])
 * ```
 */
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
