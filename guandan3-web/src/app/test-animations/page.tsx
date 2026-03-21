'use client'

import { useState } from 'react'
import DealAnimation from '@/components/animations/DealAnimation'
import PlayCardAnimation from '@/components/animations/PlayCardAnimation'
import VictoryEffect from '@/components/animations/VictoryEffect'
import ComboEffect from '@/components/animations/ComboEffect'
import AmbientAnimation from '@/components/animations/AmbientAnimation'

export default function TestAnimationsPage() {
  const [showDeal, setShowDeal] = useState(false)
  const [showPlay, setShowPlay] = useState(false)
  const [showVictory, setShowVictory] = useState(false)
  const [showDefeat, setShowDefeat] = useState(false)
  const [showCombo, setShowCombo] = useState(false)
  const [comboCount, setComboCount] = useState(2)

  const testCards = [
    { suit: '♠', rank: 'A' },
    { suit: '♥', rank: 'K' },
    { suit: '♦', rank: 'Q' },
    { suit: '♣', rank: 'J' },
    { suit: '♠', rank: '10' },
    { suit: '♥', rank: '9' },
    { suit: '♦', rank: '8' },
    { suit: '♣', rank: '7' },
    { suit: '♠', rank: '6' },
    { suit: '♥', rank: '5' },
  ]

  return (
    <AmbientAnimation className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">动画系统测试</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => {
              setShowDeal(true)
              setTimeout(() => setShowDeal(false), 2000)
            }}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            测试发牌动画
          </button>

          <button
            onClick={() => {
              setShowPlay(true)
              setTimeout(() => setShowPlay(false), 1000)
            }}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
          >
            测试出牌动画
          </button>

          <button
            onClick={() => {
              setShowVictory(true)
              setTimeout(() => setShowVictory(false), 3500)
            }}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
          >
            测试胜利特效
          </button>

          <button
            onClick={() => {
              setShowDefeat(true)
              setTimeout(() => setShowDefeat(false), 3500)
            }}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            测试失败特效
          </button>

          <div className="md:col-span-2 flex items-center gap-4">
            <select
              value={comboCount}
              onChange={(e) => setComboCount(Number(e.target.value))}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              <option value={2}>2连击</option>
              <option value={3}>3连击</option>
              <option value={4}>4连击</option>
              <option value={5}>5连击</option>
            </select>
            <button
              onClick={() => {
                setShowCombo(true)
                setTimeout(() => setShowCombo(false), 2000)
              }}
              className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
            >
              测试连击效果
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 min-h-[400px] relative overflow-hidden">
          <h2 className="text-xl font-semibold text-white mb-4">动画展示区域</h2>

          {showDeal && (
            <DealAnimation
              cards={testCards}
              dealSpeed={100}
            />
          )}

          {showPlay && (
            <PlayCardAnimation
              visible={showPlay}
              cards={[
                { id: 1, suit: 'S', rank: 'A', val: 14 },
                { id: 2, suit: 'H', rank: 'K', val: 13 },
                { id: 3, suit: 'D', rank: 'Q', val: 12 }
              ]}
              fromSeat={0}
              toSeat={1}
              mySeat={0}
              duration={0.5}
            />
          )}

          {showVictory && (
            <VictoryEffect visible={showVictory} type="victory" />
          )}

          {showDefeat && (
            <VictoryEffect visible={showDefeat} type="defeat" />
          )}

          {showCombo && (
            <ComboEffect visible={showCombo} comboCount={comboCount} />
          )}

          {!showDeal && !showPlay && !showVictory && !showDefeat && !showCombo && (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              点击上方按钮测试动画效果
            </div>
          )}
        </div>

        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">动画系统功能清单</h2>
          <ul className="space-y-2 text-gray-300">
            <li>✅ 发牌动画 - 卡牌从中心飞向玩家位置</li>
            <li>✅ 出牌动画 - 卡牌从手牌位置飞向出牌区域</li>
            <li>✅ 胜利特效 - 金色粒子爆炸效果</li>
            <li>✅ 失败特效 - 灰色粒子效果</li>
            <li>✅ 连击效果 - 动态连击计数显示</li>
            <li>✅ 环境动画 - 背景呼吸效果</li>
          </ul>
        </div>
      </div>
    </AmbientAnimation>
  )
}
