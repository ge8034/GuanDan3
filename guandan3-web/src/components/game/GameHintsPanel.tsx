'use client'

import { useState, useMemo } from 'react'
import { CardHint, PlaySuggestion, StrategyAdvice, WinProbability } from '@/types/game-hints'
import { gameHintsService } from '@/lib/services/game-hints'
import { Button } from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

export function GameHintsPanel() {
  const { myHand, lastAction, turnNo, status } = useGameStore()
  const { currentRoom, members } = useRoomStore()
  const [showHints, setShowHints] = useState(false)
  const [activeTab, setActiveTab] = useState<'hints' | 'suggestions' | 'strategy' | 'probability'>('hints')

  const gameHintsData = useMemo(() => {
    if (!myHand || myHand.length === 0 || status !== 'playing') {
      return {
        hints: [] as CardHint[],
        suggestions: [] as PlaySuggestion[],
        strategyAdvice: [] as StrategyAdvice[],
        winProbability: null as WinProbability | null
      }
    }

    const gamePhase: 'early' | 'mid' | 'late' = turnNo < 10 ? 'early' : turnNo < 20 ? 'mid' : 'late'
    const teamScore = 0
    const opponentScore = 0

    const handIds = myHand.map(card => card.id)
    const lastPlayIds = lastAction?.cards ? lastAction.cards.map(card => card.id) : null

    const context = {
      currentHand: handIds,
      lastPlay: lastPlayIds,
      teamScore,
      opponentScore,
      turnNo,
      isTeammateTurn: false,
      gamePhase
    }

    const newHints = gameHintsService.generateCardHints(context)
    const newSuggestions = gameHintsService.generatePlaySuggestions(context)
    const newStrategyAdvice = gameHintsService.generateStrategyAdvice(context)
    const newWinProbability = gameHintsService.calculateWinProbability(context, null)

    return {
      hints: newHints,
      suggestions: newSuggestions,
      strategyAdvice: newStrategyAdvice,
      winProbability: newWinProbability
    }
  }, [myHand, lastAction, turnNo, status])

  const handleHintClick = (hint: CardHint) => {
    if (hint.cards.length > 0) {
      // 提示卡牌已选择，可在此触发选牌回调
      // console.log('Selected hint cards:', hint.cards)
    }
  }

  const handleSuggestionClick = (_suggestion: PlaySuggestion) => {
    // 出牌建议已选择，可在此触发出牌回调
    // console.log('Selected suggestion:', suggestion)
  }

  if (!showHints) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowHints(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        💡 智能提示
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">💡 智能提示</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHints(false)}
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </Button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={activeTab === 'hints' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('hints')}
            >
              出牌提示
            </Button>
            <Button
              variant={activeTab === 'suggestions' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('suggestions')}
            >
              出牌建议
            </Button>
            <Button
              variant={activeTab === 'strategy' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('strategy')}
            >
              策略建议
            </Button>
            <Button
              variant={activeTab === 'probability' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('probability')}
            >
              胜率分析
            </Button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'hints' && (
            <div className="space-y-3">
              {gameHintsData.hints.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无提示</p>
              ) : (
                gameHintsData.hints.map((hint, index) => (
                  <div
                    key={index}
                    onClick={() => handleHintClick(hint)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      hint.hintType === 'suggested'
                        ? 'bg-green-50 border-2 border-green-300 hover:bg-green-100'
                        : hint.hintType === 'warning'
                        ? 'bg-red-50 border-2 border-red-300 hover:bg-red-100'
                        : 'bg-blue-50 border-2 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium flex items-center gap-1">
                        {hint.hintType === 'suggested' ? <><CheckCircle className="w-4 h-4 text-green-600" /> 推荐</> : hint.hintType === 'warning' ? <><AlertTriangle className="w-4 h-4 text-amber-600" /> 警告</> : <><Info className="w-4 h-4 text-blue-600" /> 提示</>}
                      </span>
                      <span className="text-xs text-gray-500">
                        置信度: {(hint.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{hint.reason}</p>
                    {hint.cards.length > 0 && (
                      <div className="mt-2 flex gap-1">
                        {hint.cards.map((card, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white rounded text-xs font-mono"
                          >
                            {card % 100}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="space-y-3">
              {gameHintsData.suggestions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无建议</p>
              ) : (
                gameHintsData.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{suggestion.playType}</span>
                      <span className="text-xs text-gray-500">
                        置信度: {(suggestion.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{suggestion.reason}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`px-2 py-1 rounded ${
                        suggestion.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                        suggestion.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {suggestion.riskLevel === 'low' ? '低风险' :
                         suggestion.riskLevel === 'medium' ? '中风险' : '高风险'}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        suggestion.expectedOutcome === 'win' ? 'bg-green-100 text-green-700' :
                        suggestion.expectedOutcome === 'lose' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {suggestion.expectedOutcome === 'win' ? '预期胜利' :
                         suggestion.expectedOutcome === 'lose' ? '预期失败' : '预期平局'}
                      </span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {suggestion.cards.map((card, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white rounded text-xs font-mono"
                        >
                          {card % 100}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="space-y-3">
              {gameHintsData.strategyAdvice.length === 0 ? (
                <p className="text-gray-500 text-center py-4">暂无策略建议</p>
              ) : (
                gameHintsData.strategyAdvice.map((advice, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      advice.type === 'offensive' ? 'bg-red-50 border-l-4 border-red-400' :
                      advice.type === 'defensive' ? 'bg-blue-50 border-l-4 border-blue-400' :
                      'bg-green-50 border-l-4 border-green-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {advice.type === 'offensive' ? '⚔️' :
                         advice.type === 'defensive' ? '🛡️' : '⚖️'}
                      </span>
                      <span className="text-sm font-medium">
                        {advice.type === 'offensive' ? '进攻策略' :
                         advice.type === 'defensive' ? '防守策略' : '平衡策略'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{advice.advice}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'probability' && gameHintsData.winProbability && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">
                  {(gameHintsData.winProbability.current * 100).toFixed(0)}%
                </div>
                <p className="text-sm text-gray-600">当前胜率</p>
              </div>

              {gameHintsData.winProbability.change !== 0 && (
                <div className="text-center">
                  <div className={`text-2xl font-bold mb-2 ${
                    gameHintsData.winProbability.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {gameHintsData.winProbability.change > 0 ? '+' : ''}{(gameHintsData.winProbability.change * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">出牌后变化</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">影响因素</h4>
                <div className="space-y-2">
                  {gameHintsData.winProbability.factors.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-700">{factor.description}</span>
                      <span className={`font-medium ${
                        factor.impact > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {factor.impact > 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
