'use client'

import { useRef, useCallback } from 'react'

export function useFPSThrottle(targetFPS: number = 60) {
  const lastFrameTimeRef = useRef(0)
  const frameInterval = 1000 / targetFPS

  const shouldUpdate = useCallback(() => {
    const now = performance.now()
    const elapsed = now - lastFrameTimeRef.current

    if (elapsed >= frameInterval) {
      lastFrameTimeRef.current = now - (elapsed % frameInterval)
      return true
    }

    return false
  }, [frameInterval])

  const reset = useCallback(() => {
    lastFrameTimeRef.current = 0
  }, [])

  return {
    shouldUpdate,
    reset
  }
}
