'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, SoftShadows } from '@react-three/drei'
import { Suspense, useMemo } from 'react'
import * as THREE from 'three'
import Card3D from './Card3D'
import Enhanced3DScene from './Enhanced3DScene'
import { use3DPerformance } from '@/hooks/use3DPerformance'

interface GameTable3DProps {
  cards?: Array<{
    id: string
    suit: string
    rank: string
    position: [number, number, number]
    rotation?: [number, number, number]
    isSelected?: boolean
  }>
  onCardClick?: (cardId: string) => void
  onCardHover?: (cardId: string, isHovered: boolean) => void
}

export default function GameTable3D({ 
  cards = [], 
  onCardClick, 
  onCardHover 
}: GameTable3DProps) {
  const { capabilities } = use3DPerformance()
  
  const dpr = useMemo<[number, number]>(() => {
    return [1, capabilities.pixelRatio]
  }, [capabilities.pixelRatio])
  
  const shadowMapSize = useMemo(() => {
    return capabilities.shadowMapSize
  }, [capabilities.shadowMapSize])
  
  const softShadowSamples = useMemo(() => {
    switch (capabilities.geometryDetail) {
      case 'low':
        return 8
      case 'medium':
        return 12
      case 'high':
        return 16
      default:
        return 16
    }
  }, [capabilities.geometryDetail])
  
  const planeSegments = useMemo(() => {
    switch (capabilities.geometryDetail) {
      case 'low':
        return 16
      case 'medium':
        return 24
      case 'high':
        return 32
      default:
        return 32
    }
  }, [capabilities.geometryDetail])

  return (
    <div className="w-full h-screen">
      <Canvas shadows dpr={dpr}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 10, 10]} fov={50} />
          
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            minZoom={5}
            maxZoom={20}
            maxPolarAngle={Math.PI / 2.5}
          />
          
          <Environment preset="sunset" />
          
          <SoftShadows size={40} samples={softShadowSamples} focus={0} />
          
          <ambientLight intensity={0.5} color="#ffffff" />
          
          <hemisphereLight 
            args={["#87ceeb", "#1a472a", 0.6]} 
          />
          
          <directionalLight 
            position={[10, 15, 5]} 
            intensity={1.5} 
            color="#ffffff"
            castShadow 
            shadow-mapSize-width={shadowMapSize}
            shadow-mapSize-height={shadowMapSize}
            shadow-camera-near={0.5}
            shadow-camera-far={50}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
            shadow-bias={-0.0001}
            shadow-normalBias={0.02}
            shadow-radius={4}
          />
          
          <pointLight 
            position={[-5, 8, 5]} 
            intensity={0.8} 
            color="#ff6b6b" 
            distance={20}
            decay={2}
            castShadow
            shadow-mapSize-width={Math.floor(shadowMapSize / 4)}
            shadow-mapSize-height={Math.floor(shadowMapSize / 4)}
          />
          
          <pointLight 
            position={[5, 8, -5]} 
            intensity={0.8} 
            color="#4ecdc4" 
            distance={20}
            decay={2}
            castShadow
            shadow-mapSize-width={Math.floor(shadowMapSize / 4)}
            shadow-mapSize-height={Math.floor(shadowMapSize / 4)}
          />
          
          <spotLight
            position={[0, 20, 0]}
            angle={0.4}
            penumbra={0.6}
            intensity={1.0}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={Math.floor(shadowMapSize / 2)}
            shadow-mapSize-height={Math.floor(shadowMapSize / 2)}
            shadow-camera-near={1}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          <Enhanced3DScene>
            <TableSurface planeSegments={planeSegments} />
            
            {cards.map((card) => (
              <Card3D
                key={card.id}
                suit={card.suit}
                rank={card.rank}
                position={card.position}
                rotation={card.rotation}
                isSelected={card.isSelected}
                onClick={() => onCardClick?.(card.id)}
                onHover={(isHovered) => onCardHover?.(card.id, isHovered)}
              />
            ))}
          </Enhanced3DScene>
        </Suspense>
      </Canvas>
    </div>
  )
}

function TableSurface({ planeSegments = 32 }: { planeSegments: number }) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[20, 20, planeSegments, planeSegments]} />
      <meshStandardMaterial 
        color="#1a472a"
        roughness={0.8}
        metalness={0.1}
        envMapIntensity={0.3}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
