export interface PerformanceConfig {
  enable3D: boolean
  quality: 'low' | 'medium' | 'high'
  maxFPS: number
  enableShadows: boolean
  enableParticles: boolean
  enableAnimations: boolean
}

export function getPerformanceConfig(): PerformanceConfig {
  const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  const isLowEnd = isLowEndDevice()
  const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 2 : 3)

  if (isLowEnd || isMobile) {
    return {
      enable3D: !isLowEnd,
      quality: 'low',
      maxFPS: 30,
      enableShadows: false,
      enableParticles: false,
      enableAnimations: false
    }
  }

  return {
    enable3D: true,
    quality: 'high',
    maxFPS: 60,
    enableShadows: true,
    enableParticles: true,
    enableAnimations: true
  }
}

function isLowEndDevice(): boolean {
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
  
  if (!gl) return true

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as any
  if (!debugInfo) return false

  const renderer = debugInfo.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
  const vendor = debugInfo.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)

  const lowEndGPUs = [
    'Adreno 200',
    'Adreno 205',
    'Adreno 305',
    'Adreno 320',
    'Mali-400',
    'Mali-450',
    'Mali-T720',
    'PowerVR SGX 544',
    'PowerVR SGX 554',
    'Intel HD Graphics',
    'Intel UHD Graphics 600'
  ]

  return lowEndGPUs.some(gpu => renderer.includes(gpu) || vendor.includes(gpu))
}

export function throttleFPS(callback: (...args: any[]) => void, maxFPS: number) {
  let lastTime = 0
  const minFrameTime = 1000 / maxFPS

  return (...args: any[]) => {
    const now = performance.now()
    const elapsed = now - lastTime

    if (elapsed >= minFrameTime) {
      lastTime = now
      callback(...args)
    }
  }
}

export function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null

  return (...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function requestIdleCallback(callback: () => void, timeout: number = 2000): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, { timeout })
  }

  return setTimeout(callback, timeout) as unknown as number
}

export function cancelIdleCallback(handle: number) {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(handle)
  } else {
    clearTimeout(handle)
  }
}

export function measurePerformance(label: string) {
  if (typeof performance === 'undefined' || !performance.mark) return () => {}

  const startMark = `${label}-start`
  const endMark = `${label}-end`
  const measureName = `${label}-measure`

  performance.mark(startMark)

  return () => {
    performance.mark(endMark)
    performance.measure(measureName, startMark, endMark)

    const measure = performance.getEntriesByName(measureName)[0]
    if (measure) {
      console.log(`[Performance] ${label}: ${measure.duration.toFixed(2)}ms`)
    }

    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  }
}

export class PerformanceMonitor {
  private fps: number = 60
  private frameCount: number = 0
  private lastTime: number = performance.now()
  private updateInterval: number = 1000
  private lastUpdate: number = this.lastTime
  private callbacks: Set<(fps: number) => void> = new Set()

  constructor() {
    this.start()
  }

  private start() {
    const update = () => {
      const now = performance.now()
      const elapsed = now - this.lastUpdate

      if (elapsed >= this.updateInterval) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastUpdate = now

        this.callbacks.forEach(callback => callback(this.fps))
      }

      requestAnimationFrame(update)
    }

    requestAnimationFrame(update)
  }

  public onFPSChange(callback: (fps: number) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  public getFPS(): number {
    return this.fps
  }

  public recordFrame() {
    this.frameCount++
  }
}

export function createPerformanceMonitor() {
  return new PerformanceMonitor()
}
