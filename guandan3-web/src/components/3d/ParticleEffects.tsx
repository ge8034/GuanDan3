'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { use3DPerformance } from '@/hooks/use3DPerformance'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: string
}

interface ParticleEffectsProps {
  type: 'play' | 'victory' | 'defeat'
  position: [number, number, number]
  onComplete?: () => void
}

export function ParticleEffects({ type, position, onComplete }: ParticleEffectsProps) {
  const { capabilities } = use3DPerformance()
  const particlesRef = useRef<Particle[]>([])
  const meshRef = useRef<THREE.Points>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)

  const baseParticleCount = type === 'victory' ? 200 : type === 'defeat' ? 100 : 50
  const particleCount = useMemo(() => {
    return Math.min(baseParticleCount, Math.floor(capabilities.particleCount * 1.5))
  }, [baseParticleCount, capabilities.particleCount])
  
  const colors = useMemo(() => {
    switch (type) {
      case 'victory':
        return ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
      case 'defeat':
        return ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb']
      case 'play':
        return ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
      default:
        return ['#ffffff']
    }
  }, [type])

  useEffect(() => {
    const particles: Particle[] = []
    const posArray = new Float32Array(particleCount * 3)
    const colorArray = new Float32Array(particleCount * 3)
    const sizeArray = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      const particle: Particle = {
        position: new THREE.Vector3(
          position[0] + (Math.random() - 0.5) * 2,
          position[1] + Math.random() * 2,
          position[2] + (Math.random() - 0.5) * 2
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.1 + 0.05,
          (Math.random() - 0.5) * 0.1
        ),
        life: 1,
        maxLife: 1 + Math.random() * 0.5,
        size: Math.random() * 0.1 + 0.05,
        color: colors[Math.floor(Math.random() * colors.length)]
      }

      particles.push(particle)
      posArray[i * 3] = particle.position.x
      posArray[i * 3 + 1] = particle.position.y
      posArray[i * 3 + 2] = particle.position.z

      const color = new THREE.Color(particle.color)
      colorArray[i * 3] = color.r
      colorArray[i * 3 + 1] = color.g
      colorArray[i * 3 + 2] = color.b

      sizeArray[i] = particle.size
    }

    particlesRef.current = particles

    if (geometryRef.current) {
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(posArray, 3))
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colorArray, 3))
      geometryRef.current.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1))
    }

    return () => {
      particlesRef.current = []
    }
  }, [type, position, colors, particleCount])

  useFrame((state, delta) => {
    const particles = particlesRef.current
    if (particles.length === 0 || !geometryRef.current) return

    const positions = geometryRef.current.attributes.position.array as Float32Array
    const sizes = geometryRef.current.attributes.size.array as Float32Array

    let aliveCount = 0

    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]
      particle.life -= delta / particle.maxLife

      if (particle.life <= 0) {
        sizes[i] = 0
        continue
      }

      aliveCount++

      particle.velocity.y -= 0.001
      particle.position.add(particle.velocity)

      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z

      sizes[i] = particle.size * particle.life
    }

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.size.needsUpdate = true

    if (aliveCount === 0 && onComplete) {
      onComplete()
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(particleCount * 3), 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[new Float32Array(particleCount * 3), 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[new Float32Array(particleCount), 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

interface CardPlayEffectProps {
  position: [number, number, number]
  onComplete?: () => void
}

export function CardPlayEffect({ position, onComplete }: CardPlayEffectProps) {
  return (
    <ParticleEffects
      type="play"
      position={position}
      onComplete={onComplete}
    />
  )
}

interface VictoryEffectProps {
  onComplete?: () => void
}

export function VictoryEffect({ onComplete }: VictoryEffectProps) {
  return (
    <ParticleEffects
      type="victory"
      position={[0, 2, 0]}
      onComplete={onComplete}
    />
  )
}

interface DefeatEffectProps {
  onComplete?: () => void
}

export function DefeatEffect({ onComplete }: DefeatEffectProps) {
  return (
    <ParticleEffects
      type="defeat"
      position={[0, 2, 0]}
      onComplete={onComplete}
    />
  )
}
