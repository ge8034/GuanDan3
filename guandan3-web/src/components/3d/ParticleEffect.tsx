'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ParticleEffectProps {
  position?: [number, number, number]
  count?: number
  color?: string
  size?: number
  duration?: number
  onComplete?: () => void
}

export default function ParticleEffect({ 
  position = [0, 0, 0], 
  count = 50, 
  color = '#FFD700',
  size = 0.1,
  duration = 2,
  onComplete 
}: ParticleEffectProps) {
  const particlesRef = useRef<THREE.Points>(null)
  const startTime = useRef(0)
  const velocitiesRef = useRef<Float32Array | null>(null)
  const [positions, setPositions] = useState<Float32Array | null>(null)
  const [colors, setColors] = useState<Float32Array | null>(null)

  useEffect(() => {
    startTime.current = Date.now()
  }, [])

  useEffect(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const colorObj = new THREE.Color(color)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position[0]
      positions[i * 3 + 1] = position[1]
      positions[i * 3 + 2] = position[2]

      velocities[i * 3] = (Math.random() - 0.5) * 2
      velocities[i * 3 + 1] = Math.random() * 3
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2

      colors[i * 3] = colorObj.r
      colors[i * 3 + 1] = colorObj.g
      colors[i * 3 + 2] = colorObj.b
    }

    const timer = setTimeout(() => {
      setPositions(positions)
      velocitiesRef.current = velocities
      setColors(colors)
    }, 0)
    return () => clearTimeout(timer)
  }, [count, position, color])

  useFrame(() => {
    if (!particlesRef.current || !velocitiesRef.current) return

    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = elapsed / duration

    if (progress >= 1) {
      onComplete?.()
      return
    }

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const velocities = velocitiesRef.current

    for (let i = 0; i < count; i++) {
      positions[i * 3] += velocities[i * 3] * 0.016
      positions[i * 3 + 1] += velocities[i * 3 + 1] * 0.016
      positions[i * 3 + 2] += velocities[i * 3 + 2] * 0.016

      velocities[i * 3 + 1] -= 9.8 * 0.016
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions || new Float32Array(count * 3)}
          itemSize={3}
          args={[positions || new Float32Array(count * 3), 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors || new Float32Array(count * 3)}
          itemSize={3}
          args={[colors || new Float32Array(count * 3), 3]}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={size} 
        vertexColors 
        transparent 
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
