'use client'

import { useRef, memo, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, PointMaterial, Sphere } from '@react-three/drei'
import { Group, Mesh } from 'three'
import * as THREE from 'three'
import { use3DPerformance } from '@/hooks/use3DPerformance'

interface Enhanced3DSceneProps {
  children?: React.ReactNode
  particleCount?: number
  orbCount?: number
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const DEFAULT_PARTICLE_COUNT = 150
const DEFAULT_ORB_COUNT = 3

function generateParticlesData(count: number) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (seededRandom(i * 3) - 0.5) * 20
    positions[i * 3 + 1] = seededRandom(i * 3 + 1) * 10
    positions[i * 3 + 2] = (seededRandom(i * 3 + 2) - 0.5) * 20
    
    const color = new THREE.Color()
    color.setHSL(seededRandom(i * 3 + 3) * 0.1 + 0.55, 0.7, 0.6)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  
  return { positions, colors }
}

interface OrbData {
  position: [number, number, number]
  scale: number
  color: THREE.Color
  speed: number
}

function generateOrbsData(count: number): OrbData[] {
  return Array.from({ length: count }, (_, i) => ({
    position: [
      (seededRandom(i * 4) - 0.5) * 15,
      seededRandom(i * 4 + 1) * 5 + 2,
      (seededRandom(i * 4 + 2) - 0.5) * 15
    ] as [number, number, number],
    scale: seededRandom(i * 4 + 3) * 0.5 + 0.5,
    color: new THREE.Color().setHSL(seededRandom(i * 4 + 4) * 0.2 + 0.5, 0.8, 0.6),
    speed: seededRandom(i * 4 + 5) * 0.5 + 0.5
  }))
}

const FloatingParticles = memo(function FloatingParticles({ particleCount }: { particleCount: number }) {
  const particlesRef = useRef<Group>(null)
  const particlesData = useMemo(() => generateParticlesData(particleCount), [particleCount])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={particlesRef}>
      <Points positions={particlesData.positions}>
        <PointMaterial
          transparent
          vertexColors
          size={0.1}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    </group>
  )
})

const FloatingOrbs = memo(function FloatingOrbs({ orbCount, geometryDetail }: { orbCount: number; geometryDetail: 'low' | 'medium' | 'high' }) {
  const orbRefs = useRef<Mesh[]>([])
  const orbsData = useMemo(() => generateOrbsData(orbCount), [orbCount])
  
  const sphereSegments = useMemo(() => {
    switch (geometryDetail) {
      case 'low':
        return 12
      case 'medium':
        return 18
      case 'high':
        return 24
      default:
        return 24
    }
  }, [geometryDetail])

  useFrame((state) => {
    orbRefs.current.forEach((orb, i) => {
      if (orb) {
        const time = state.clock.elapsedTime * orbsData[i].speed
        orb.position.y = orbsData[i].position[1] + Math.sin(time) * 0.5
        orb.position.x = orbsData[i].position[0] + Math.cos(time * 0.5) * 0.3
        orb.rotation.x = time * 0.5
        orb.rotation.y = time * 0.3
      }
    })
  })

  return (
    <group>
      {orbsData.map((orb, i) => (
        <Sphere
          key={i}
          ref={(el) => {
            if (el) orbRefs.current[i] = el
          }}
          position={orb.position}
          scale={orb.scale}
          args={[1, sphereSegments, sphereSegments]}
          castShadow
        >
          <meshStandardMaterial
            color={orb.color}
            roughness={0.3}
            metalness={0.7}
            envMapIntensity={0.8}
            transparent
            opacity={0.3}
          />
        </Sphere>
      ))}
    </group>
  )
})

const AmbientGlow = memo(function AmbientGlow() {
  const glowRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      const intensity = (Math.sin(state.clock.elapsedTime * 0.5) + 1) * 0.5
      const material = glowRef.current.material as any
      if (material) {
        material.opacity = intensity * 0.1
      }
    }
  })

  return (
    <mesh ref={glowRef} position={[0, 5, 0]}>
      <sphereGeometry args={[8, 24, 24]} />
      <meshBasicMaterial
        color="#4ecdc4"
        transparent
        opacity={0.05}
        side={THREE.BackSide}
      />
    </mesh>
  )
})

export default function Enhanced3DScene({ 
  children, 
  particleCount = DEFAULT_PARTICLE_COUNT,
  orbCount = DEFAULT_ORB_COUNT 
}: Enhanced3DSceneProps) {
  const { capabilities } = use3DPerformance()
  
  const actualParticleCount = useMemo(() => {
    return Math.min(particleCount, capabilities.particleCount)
  }, [particleCount, capabilities.particleCount])
  
  const actualOrbCount = useMemo(() => {
    return Math.min(orbCount, Math.floor(capabilities.particleCount / 10))
  }, [orbCount, capabilities.particleCount])

  return (
    <>
      <FloatingParticles particleCount={actualParticleCount} />
      <FloatingOrbs orbCount={actualOrbCount} geometryDetail={capabilities.geometryDetail} />
      <AmbientGlow />
      {children}
    </>
  )
}
