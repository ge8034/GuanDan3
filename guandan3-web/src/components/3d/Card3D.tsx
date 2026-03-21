'use client'

import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Box } from '@react-three/drei'
import { Mesh, Vector3 } from 'three'

interface Card3DProps {
  suit: string
  rank: string
  position: [number, number, number]
  rotation?: [number, number, number]
  isSelected?: boolean
  onClick?: () => void
  onHover?: (isHovered: boolean) => void
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
}

const SUIT_COLORS: Record<string, string> = {
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#1f2937',
  spades: '#1f2937'
}

export default function Card3D({ 
  suit, 
  rank, 
  position, 
  rotation = [0, 0, 0], 
  isSelected = false,
  onClick,
  onHover 
}: Card3DProps) {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  
  const targetPosition = useMemo(() => {
    const pos = new Vector3(...position)
    if (isSelected) {
      pos.y += 0.5
    }
    return pos
  }, [position, isSelected])
  
  const suitSymbol = useMemo(() => SUIT_SYMBOLS[suit] || suit, [suit])
  const suitColor = useMemo(() => SUIT_COLORS[suit] || '#1f2937', [suit])
  
  const cardColor = useMemo(() => {
    if (isSelected) return '#fef3c7'
    if (hovered) return '#f0f9ff'
    return '#ffffff'
  }, [isSelected, hovered])
  
  const emissiveColor = useMemo(() => {
    return hovered ? suitColor : '#000000'
  }, [hovered, suitColor])
  
  const emissiveIntensity = useMemo(() => {
    return hovered ? 0.1 : 0
  }, [hovered])
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.lerp(targetPosition, delta * 10)
      
      if (isFlipping) {
        const flipProgress = (Math.sin(state.clock.elapsedTime * 3) + 1) / 2
        meshRef.current.rotation.y = flipProgress * Math.PI
      } else if (hovered || isSelected) {
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.1
        meshRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      } else {
        meshRef.current.rotation.x = rotation[0]
        meshRef.current.rotation.y = rotation[1]
        meshRef.current.rotation.z = rotation[2]
      }
    }
  })

  const handleClick = useCallback(() => {
    setIsFlipping(true)
    setTimeout(() => {
      setIsFlipping(false)
      onClick?.()
    }, 500)
  }, [onClick])

  const handlePointerOver = useCallback(() => {
    setHovered(true)
    onHover?.(true)
  }, [onHover])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    onHover?.(false)
  }, [onHover])

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        rotation={rotation}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <Box args={[2, 3, 0.05]}>
          <meshStandardMaterial 
            color={cardColor}
            roughness={0.3}
            metalness={0.1}
            envMapIntensity={0.6}
            emissive={emissiveColor}
            emissiveIntensity={emissiveIntensity}
          />
        </Box>
        
        <Text
          position={[0, 0.8, 0.03]}
          fontSize={0.4}
          color={suitColor}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          {rank}
        </Text>
        
        <Text
          position={[0, 0, 0.03]}
          fontSize={1.2}
          color={suitColor}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Inter-Bold.woff"
        >
          {suitSymbol}
        </Text>
        
        <Text
          position={[0, -0.8, 0.03]}
          fontSize={0.4}
          color={suitColor}
          anchorX="center"
          anchorY="middle"
          rotation={[Math.PI, 0, 0]}
          font="/fonts/Inter-Bold.woff"
        >
          {rank}
        </Text>
      </mesh>
    </group>
  )
}
