'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface DeviceCapabilities {
  isMobile: boolean
  isLowEnd: boolean
  isHighEnd: boolean
  maxFPS: number
  pixelRatio: number
  shadowMapSize: number
  particleCount: number
  geometryDetail: 'low' | 'medium' | 'high'
}

const DEFAULT_CAPABILITIES: DeviceCapabilities = {
  isMobile: false,
  isLowEnd: false,
  isHighEnd: true,
  maxFPS: 60,
  pixelRatio: 2,
  shadowMapSize: 4096,
  particleCount: 150,
  geometryDetail: 'high'
}

const MOBILE_CAPABILITIES: DeviceCapabilities = {
  isMobile: true,
  isLowEnd: false,
  isHighEnd: false,
  maxFPS: 30,
  pixelRatio: 1.5,
  shadowMapSize: 1024,
  particleCount: 50,
  geometryDetail: 'medium'
}

const LOW_END_CAPABILITIES: DeviceCapabilities = {
  isMobile: true,
  isLowEnd: true,
  isHighEnd: false,
  maxFPS: 24,
  pixelRatio: 1,
  shadowMapSize: 512,
  particleCount: 30,
  geometryDetail: 'low'
}

function detectDeviceCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined') {
    return DEFAULT_CAPABILITIES
  }

  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  
  if (!isMobile) {
    return DEFAULT_CAPABILITIES
  }

  const hardwareConcurrency = navigator.hardwareConcurrency || 2
  const deviceMemory = (navigator as any).deviceMemory || 4
  const isLowEnd = hardwareConcurrency < 4 || deviceMemory < 4

  if (isLowEnd) {
    return LOW_END_CAPABILITIES
  }

  return MOBILE_CAPABILITIES
}

export function use3DPerformance() {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities())
  const [currentFPS, setCurrentFPS] = useState(0)
  const [isPerformanceMode, setIsPerformanceMode] = useState(false)
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const fpsHistoryRef = useRef<number[]>([])
  const rafIdRef = useRef<number | undefined>(undefined)
  const capabilitiesRef = useRef(capabilities)

  useEffect(() => {
    capabilitiesRef.current = capabilities
  }, [capabilities])

  useEffect(() => {
    lastTimeRef.current = Date.now()

    const measureFPS = () => {
      frameCountRef.current++
      const now = Date.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed)
        setCurrentFPS(fps)
        
        fpsHistoryRef.current.push(fps)
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift()
        }

        const avgFPS = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        const currentCapabilities = capabilitiesRef.current
        
        if (avgFPS < currentCapabilities.maxFPS * 0.7 && !isPerformanceMode) {
          setIsPerformanceMode(true)
          setCapabilities(prev => ({
            ...prev,
            maxFPS: Math.max(24, prev.maxFPS - 6),
            particleCount: Math.max(20, Math.floor(prev.particleCount * 0.7)),
            shadowMapSize: Math.max(512, Math.floor(prev.shadowMapSize * 0.7))
          }))
        } else if (avgFPS >= currentCapabilities.maxFPS * 0.9 && isPerformanceMode) {
          setIsPerformanceMode(false)
        }

        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      rafIdRef.current = requestAnimationFrame(measureFPS)
    }

    rafIdRef.current = requestAnimationFrame(measureFPS)

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isPerformanceMode])

  const shouldRender = useCallback((targetFPS: number) => {
    return currentFPS === 0 || currentFPS >= targetFPS * 0.8
  }, [currentFPS])

  return {
    capabilities,
    currentFPS,
    isPerformanceMode,
    shouldRender
  }
}
