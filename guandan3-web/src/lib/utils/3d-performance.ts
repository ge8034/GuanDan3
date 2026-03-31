import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

import { logger } from '@/lib/utils/logger'
interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  drawCalls: number
  triangles: number
}

interface PerformanceOptions {
  targetFPS?: number
  enableMemoryManagement?: boolean
  enableLOD?: boolean
  maxDrawCalls?: number
}

class PerformanceMonitor {
  private frameCount = 0
  private lastTime = performance.now()
  private fps = 60
  private frameTime = 16.67
  private metrics: PerformanceMetrics = {
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0
  }
  private updateInterval = 1000
  private lastUpdate = 0

  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene): PerformanceMetrics {
    this.frameCount++
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (deltaTime >= this.updateInterval) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameTime = deltaTime / this.frameCount
      this.frameCount = 0
      this.lastTime = currentTime

      const info = renderer.info
      this.metrics = {
        fps: this.fps,
        frameTime: this.frameTime,
        memoryUsage: this.getMemoryUsage(),
        drawCalls: info.render.calls,
        triangles: info.render.triangles
      }

      this.lastUpdate = currentTime
    }

    return this.metrics
  }

  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory
      if (memory) {
        return Math.round(memory.usedJSHeapSize / 1048576)
      }
    }
    return 0
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics
  }

  isPerformanceGood(): boolean {
    return this.fps >= 30 && this.frameTime <= 33.33
  }

  isPerformanceExcellent(): boolean {
    return this.fps >= 55 && this.frameTime <= 18.18
  }
}

class ResourceManager {
  private textures = new Map<string, THREE.Texture>()
  private geometries = new Map<string, THREE.BufferGeometry>()
  private materials = new Map<string, THREE.Material>()
  private maxCacheSize = 50

  getTexture(key: string, loader: () => THREE.Texture): THREE.Texture {
    if (this.textures.has(key)) {
      return this.textures.get(key)!
    }

    const texture = loader()
    this.textures.set(key, texture)

    if (this.textures.size > this.maxCacheSize) {
      const firstKey = this.textures.keys().next().value
      if (firstKey !== undefined) {
        const oldTexture = this.textures.get(firstKey)
        oldTexture?.dispose()
        this.textures.delete(firstKey)
      }
    }

    return texture
  }

  getGeometry(key: string, creator: () => THREE.BufferGeometry): THREE.BufferGeometry {
    if (this.geometries.has(key)) {
      return this.geometries.get(key)!
    }

    const geometry = creator()
    this.geometries.set(key, geometry)

    if (this.geometries.size > this.maxCacheSize) {
      const firstKey = this.geometries.keys().next().value
      if (firstKey !== undefined) {
        const oldGeometry = this.geometries.get(firstKey)
        oldGeometry?.dispose()
        this.geometries.delete(firstKey)
      }
    }

    return geometry
  }

  getMaterial(key: string, creator: () => THREE.Material): THREE.Material {
    if (this.materials.has(key)) {
      return this.materials.get(key)!
    }

    const material = creator()
    this.materials.set(key, material)

    if (this.materials.size > this.maxCacheSize) {
      const firstKey = this.materials.keys().next().value
      if (firstKey !== undefined) {
        const oldMaterial = this.materials.get(firstKey)
        oldMaterial?.dispose()
        this.materials.delete(firstKey)
      }
    }

    return material
  }

  disposeTexture(key: string): void {
    const texture = this.textures.get(key)
    if (texture) {
      texture.dispose()
      this.textures.delete(key)
    }
  }

  disposeGeometry(key: string): void {
    const geometry = this.geometries.get(key)
    if (geometry) {
      geometry.dispose()
      this.geometries.delete(key)
    }
  }

  disposeMaterial(key: string): void {
    const material = this.materials.get(key)
    if (material) {
      material.dispose()
      this.materials.delete(key)
    }
  }

  disposeAll(): void {
    this.textures.forEach(texture => texture.dispose())
    this.geometries.forEach(geometry => geometry.dispose())
    this.materials.forEach(material => material.dispose())
    this.textures.clear()
    this.geometries.clear()
    this.materials.clear()
  }

  getCacheSize(): number {
    return this.textures.size + this.geometries.size + this.materials.size
  }
}

class LODManager {
  private levels: Map<string, THREE.Object3D[]> = new Map()
  private currentLevel = 0
  private maxLevels = 3

  addLOD(objectId: string, levels: THREE.Object3D[]): void {
    this.levels.set(objectId, levels)
  }

  getLOD(objectId: string, distance: number): THREE.Object3D | null {
    const levels = this.levels.get(objectId)
    if (!levels) return null

    const level = Math.min(
      Math.floor(distance / 10),
      this.maxLevels - 1
    )

    return levels[level] || levels[0]
  }

  setCurrentLevel(level: number): void {
    this.currentLevel = Math.max(0, Math.min(level, this.maxLevels - 1))
  }

  getCurrentLevel(): number {
    return this.currentLevel
  }
}

export const performanceMonitor = new PerformanceMonitor()
export const resourceManager = new ResourceManager()
export const lodManager = new LODManager()

export function usePerformanceMonitor(options: PerformanceOptions = {}) {
  const {
    targetFPS = 60,
    enableMemoryManagement = true,
    enableLOD = true,
    maxDrawCalls = 1000
  } = options

  const metricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    drawCalls: 0,
    triangles: 0
  })

  const updateMetrics = useCallback((renderer: THREE.WebGLRenderer, scene: THREE.Scene) => {
    const metrics = performanceMonitor.update(renderer, scene)
    metricsRef.current = metrics

    if (enableMemoryManagement && metrics.memoryUsage > 100) {
      logger.warn('High memory usage detected:', { memoryUsage: metrics.memoryUsage, unit: 'MB' })
    }

    if (metrics.drawCalls > maxDrawCalls) {
      logger.warn('High draw calls detected:', metrics.drawCalls)
    }

    return metrics
  }, [enableMemoryManagement, maxDrawCalls])

  const getMetrics = useCallback(() => {
    return metricsRef.current
  }, [])

  const isPerformanceGood = useCallback(() => {
    return performanceMonitor.isPerformanceGood()
  }, [])

  const isPerformanceExcellent = useCallback(() => {
    return performanceMonitor.isPerformanceExcellent()
  }, [])

  return {
    updateMetrics,
    getMetrics,
    isPerformanceGood,
    isPerformanceExcellent
  }
}

export function useResourceManager() {
  const cleanup = useCallback(() => {
    resourceManager.disposeAll()
  }, [])

  const getCacheSize = useCallback(() => {
    return resourceManager.getCacheSize()
  }, [])

  return {
    resourceManager,
    cleanup,
    getCacheSize
  }
}

export function useLOD() {
  const setLODLevel = useCallback((level: number) => {
    lodManager.setCurrentLevel(level)
  }, [])

  const getLODLevel = useCallback(() => {
    return lodManager.getCurrentLevel()
  }, [])

  return {
    setLODLevel,
    getLODLevel,
    lodManager
  }
}

export function optimizeRenderer(renderer: THREE.WebGLRenderer): void {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
}

export function optimizeScene(scene: THREE.Scene): void {
  scene.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true

      if (object.material instanceof THREE.MeshStandardMaterial) {
        object.material.envMapIntensity = 1.0
        object.material.needsUpdate = true
      }
    }
  })
}

export function createOptimizedGeometry(type: string, ...args: any[]): THREE.BufferGeometry {
  const key = `${type}-${JSON.stringify(args)}`
  return resourceManager.getGeometry(key, () => {
    switch (type) {
      case 'box':
        return new THREE.BoxGeometry(...args)
      case 'plane':
        return new THREE.PlaneGeometry(...args)
      case 'sphere':
        return new THREE.SphereGeometry(...args)
      case 'cylinder':
        return new THREE.CylinderGeometry(...args)
      default:
        return new THREE.BufferGeometry()
    }
  })
}

export function createOptimizedMaterial(
  type: string,
  params: Record<string, any>
): THREE.Material {
  const key = `${type}-${JSON.stringify(params)}`
  return resourceManager.getMaterial(key, () => {
    switch (type) {
      case 'standard':
        return new THREE.MeshStandardMaterial(params)
      case 'basic':
        return new THREE.MeshBasicMaterial(params)
      case 'phong':
        return new THREE.MeshPhongMaterial(params)
      case 'lambert':
        return new THREE.MeshLambertMaterial(params)
      default:
        return new THREE.MeshBasicMaterial(params)
    }
  })
}

export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose()
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose())
        } else {
          child.material.dispose()
        }
      }
    }
  })
}

export function calculateOptimalFPS(): number {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof window !== 'undefined' ? window.navigator.userAgent : ''
  )

  if (isMobile) {
    return 30
  }

  const isLowEnd = typeof window !== 'undefined' && 
    (window.navigator.hardwareConcurrency || 4) <= 4

  return isLowEnd ? 45 : 60
}

export function shouldReduceQuality(): boolean {
  const metrics = performanceMonitor.getMetrics()
  return !performanceMonitor.isPerformanceGood() || metrics.memoryUsage > 80
}

export function getOptimalShadowMapSize(): number {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    typeof window !== 'undefined' ? window.navigator.userAgent : ''
  )

  if (isMobile) {
    return 1024
  }

  const isLowEnd = typeof window !== 'undefined' && 
    (window.navigator.hardwareConcurrency || 4) <= 4

  return isLowEnd ? 2048 : 4096
}
