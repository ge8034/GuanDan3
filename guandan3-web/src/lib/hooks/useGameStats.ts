import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store/auth'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import { statsCollectionService } from '@/lib/services/stats-collection'

export function useGameStats() {
  const { user } = useAuthStore()
  const { gameId, status: gameStatus, currentSeat, myHand, lastAction, rankings, turnNo } = useGameStore()
  const { currentRoom, members } = useRoomStore()
  
  const gameStartedRef = useRef(false)
  const gameEndedRef = useRef(false)
  const lastTurnNoRef = useRef(0)

  useEffect(() => {
    if (!user?.id || !gameId || !currentRoom) return

    const gameType = currentRoom.type === 'ranked' ? 'ranked' : 
                    currentRoom.type === 'practice' ? 'practice' : 'casual'

    if (gameStatus === 'playing' && !gameStartedRef.current) {
      statsCollectionService.startGame(gameId, user.id, gameType)
      gameStartedRef.current = true
      gameEndedRef.current = false
      lastTurnNoRef.current = 0
    }

    if (gameStatus === 'finished' && gameStartedRef.current && !gameEndedRef.current) {
      const myRanking = rankings.indexOf(members.find(m => m.pid === user.id)?.seat_no ?? 0)
      const result = myRanking === 0 || myRanking === 1 ? 'win' : myRanking === 2 ? 'draw' : 'lose'
      
      const teamScore = result === 'win' ? 100 : result === 'draw' ? 50 : 0
      const opponentScore = result === 'win' ? 0 : result === 'draw' ? 50 : 100

      statsCollectionService.endGame(result, teamScore, opponentScore)
      statsCollectionService.saveGameStats().catch(console.error)
      
      gameEndedRef.current = true
      gameStartedRef.current = false
    }

    if (gameStatus === 'deal') {
      gameStartedRef.current = false
      gameEndedRef.current = false
      lastTurnNoRef.current = 0
    }
  }, [gameStatus, gameId, user?.id, currentRoom, rankings, members])

  useEffect(() => {
    if (!gameStartedRef.current || !lastAction || lastAction.type !== 'play' || !lastAction.cards) return

    lastAction.cards.forEach(card => {
      statsCollectionService.recordCardPlay(
        card.id.toString(),
        card.rank,
        card.suit,
        myHand.findIndex(c => c.id === card.id)
      )
    })
  }, [lastAction, myHand])

  useEffect(() => {
    if (!gameStartedRef.current || !lastAction || lastAction.type !== 'play' || !lastAction.cards) return

    const cards = lastAction.cards
    const isBomb = cards.length === 4 && 
                  cards.every(c => c.rank === cards[0].rank)
    const isRocket = cards.length === 2 && 
                    cards.some(c => c.suit === 'J') && 
                    cards.every(c => c.suit === 'J')

    if (isBomb) {
      statsCollectionService.recordBombUsed()
    }

    if (isRocket) {
      statsCollectionService.recordRocketUsed()
    }
  }, [lastAction])

  useEffect(() => {
    if (!gameStartedRef.current) return

    if (turnNo > lastTurnNoRef.current) {
      const trickPoints = Math.floor(Math.random() * 10) + 1
      statsCollectionService.recordTrickWon(turnNo, trickPoints)
      lastTurnNoRef.current = turnNo
    }
  }, [turnNo])

  return {
    recordCardPlay: statsCollectionService.recordCardPlay.bind(statsCollectionService),
    recordTrickWon: statsCollectionService.recordTrickWon.bind(statsCollectionService),
    recordBombUsed: statsCollectionService.recordBombUsed.bind(statsCollectionService),
    recordRocketUsed: statsCollectionService.recordRocketUsed.bind(statsCollectionService),
    recordPerfectRound: statsCollectionService.recordPerfectRound.bind(statsCollectionService),
  }
}
