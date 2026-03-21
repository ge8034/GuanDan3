'use client'

import { useState } from 'react'
import { CardTable3D, Card3D, ParticleEffect } from '@/components/3d'

export default function Test3DPage() {
  const [showParticles, setShowParticles] = useState(false)

  return (
    <div className="h-screen w-screen bg-gray-900">
      <div className="absolute top-4 left-4 z-10 bg-black/50 p-4 rounded-lg text-white">
        <h1 className="text-2xl font-bold mb-4">3D 测试页面</h1>
        <div className="space-y-2">
          <p>✅ Three.js 渲染引擎已集成</p>
          <p>✅ 3D 牌桌场景已创建</p>
          <p>✅ 3D 扑克牌模型已实现</p>
          <p>✅ 粒子特效已实现</p>
          <p>✅ 光影效果已添加</p>
        </div>
        <button
          onClick={() => setShowParticles(!showParticles)}
          className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          {showParticles ? '隐藏粒子特效' : '显示粒子特效'}
        </button>
      </div>

      <CardTable3D className="h-full w-full">
        <group position={[0, 0.5, 0]}>
          <Card3D suit="spades" rank="A" position={[-1, 0, 0]} />
          <Card3D suit="hearts" rank="K" position={[0, 0, 0]} />
          <Card3D suit="diamonds" rank="Q" position={[1, 0, 0]} />
          <Card3D suit="clubs" rank="J" position={[0, 0, 1]} />
        </group>
        {showParticles && (
          <ParticleEffect 
            position={[0, 1, 0]} 
            count={100} 
            color="#FFD700"
            size={0.15}
          />
        )}
      </CardTable3D>
    </div>
  )
}
