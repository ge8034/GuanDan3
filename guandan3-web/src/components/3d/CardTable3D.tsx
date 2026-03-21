'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, SoftShadows } from '@react-three/drei'
import { Suspense } from 'react'

interface CardTable3DProps {
  className?: string
  children?: React.ReactNode
}

function TableSurface() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[10, 6]} />
      <meshStandardMaterial 
        color="#1a5f2a" 
        roughness={0.7} 
        metalness={0.15}
        envMapIntensity={0.5}
      />
    </mesh>
  )
}

function TableBorder() {
  return (
    <group>
      <mesh position={[0, -0.4, 3.1]} castShadow receiveShadow>
        <boxGeometry args={[10, 0.2, 0.2]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.5} 
          metalness={0.25}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh position={[0, -0.4, -3.1]} castShadow receiveShadow>
        <boxGeometry args={[10, 0.2, 0.2]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.5} 
          metalness={0.25}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh position={[5.1, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.2, 6]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.5} 
          metalness={0.25}
          envMapIntensity={0.6}
        />
      </mesh>
      <mesh position={[-5.1, -0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 0.2, 6]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.5} 
          metalness={0.25}
          envMapIntensity={0.6}
        />
      </mesh>
    </group>
  )
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 8]} fov={50} />
      <OrbitControls 
        enablePan={false}
        enableZoom={true}
        minZoom={0.5}
        maxZoom={2}
        maxPolarAngle={Math.PI / 2.5}
      />
      
      <SoftShadows size={20} samples={12} focus={0} />
      
      <ambientLight intensity={0.4} />
      
      <directionalLight 
        position={[5, 12, 5]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />
      
      <pointLight 
        position={[-3, 6, 3]} 
        intensity={0.4} 
        color="#ff6b6b" 
        distance={10}
        castShadow
      />
      
      <pointLight 
        position={[3, 6, -3]} 
        intensity={0.4} 
        color="#4ecdc4" 
        distance={10}
        castShadow
      />
      
      <Environment preset="sunset" />
      <TableSurface />
      <TableBorder />
    </>
  )
}

export default function CardTable3D({ className, children }: CardTable3DProps) {
  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={null}>
          <Scene />
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}
