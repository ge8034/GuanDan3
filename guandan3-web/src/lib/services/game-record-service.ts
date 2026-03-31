import { createGameRecord } from '@/lib/api/game-records'
import type { GameRecordInput, GameParticipantInput, SpecialEvent } from '@/types/game-records'

import { logger } from '@/lib/utils/logger'
export class GameRecordService {
  private static instance: GameRecordService
  private currentGame: {
    room_id: string
    game_type: 'standard' | 'ranked' | 'custom'
    game_mode: '2v2' | '3v1' | '1v1'
    started_at: Date
    participants: Map<string, GameParticipantInput>
    specialEvents: SpecialEvent[]
    totalRounds: number
    totalCardsPlayed: number
    totalBombsPlayed: number
    totalRocketsPlayed: number
  } | null = null

  private constructor() {}

  static getInstance(): GameRecordService {
    if (!GameRecordService.instance) {
      GameRecordService.instance = new GameRecordService()
    }
    return GameRecordService.instance
  }

  startGame(
    roomId: string,
    gameType: 'standard' | 'ranked' | 'custom' = 'standard',
    gameMode: '2v2' | '3v1' | '1v1' = '2v2'
  ): void {
    this.currentGame = {
      room_id: roomId,
      game_type: gameType,
      game_mode: gameMode,
      started_at: new Date(),
      participants: new Map(),
      specialEvents: [],
      totalRounds: 0,
      totalCardsPlayed: 0,
      totalBombsPlayed: 0,
      totalRocketsPlayed: 0
    }
  }

  addParticipant(
    userId: string,
    team: 'team_a' | 'team_b',
    position: number
  ): void {
    if (!this.currentGame) return

    this.currentGame.participants.set(userId, {
      user_id: userId,
      team,
      position,
      is_winner: false,
      cards_played: 0,
      bombs_played: 0,
      rockets_played: 0,
      straights_played: 0,
      aircraft_played: 0,
      performance_score: 0,
      mvp: false,
      level_change: 0,
      rank_points_change: 0
    })
  }

  recordCardPlay(userId: string, cardCount: number = 1): void {
    if (!this.currentGame) return

    const participant = this.currentGame.participants.get(userId)
    if (participant) {
      participant.cards_played += cardCount
      this.currentGame.totalCardsPlayed += cardCount
    }
  }

  recordBombPlay(userId: string): void {
    if (!this.currentGame) return

    const participant = this.currentGame.participants.get(userId)
    if (participant) {
      participant.bombs_played += 1
      this.currentGame.totalBombsPlayed += 1
    }
  }

  recordRocketPlay(userId: string): void {
    if (!this.currentGame) return

    const participant = this.currentGame.participants.get(userId)
    if (participant) {
      participant.rockets_played += 1
      this.currentGame.totalRocketsPlayed += 1
    }

    this.addSpecialEvent({
      type: 'rocket',
      timestamp: new Date().toISOString(),
      user_id: userId,
      description: '王炸'
    })
  }

  recordStraightPlay(userId: string): void {
    if (!this.currentGame) return

    const participant = this.currentGame.participants.get(userId)
    if (participant) {
      participant.straights_played += 1
    }
  }

  recordAircraftPlay(userId: string): void {
    if (!this.currentGame) return

    const participant = this.currentGame.participants.get(userId)
    if (participant) {
      participant.aircraft_played += 1
    }
  }

  recordFourWithTwo(userId: string): void {
    if (!this.currentGame) return

    this.addSpecialEvent({
      type: 'four_with_two',
      timestamp: new Date().toISOString(),
      user_id: userId,
      description: '四带二'
    })
  }

  recordStraightFlush(userId: string): void {
    if (!this.currentGame) return

    this.addSpecialEvent({
      type: 'straight_flush',
      timestamp: new Date().toISOString(),
      user_id: userId,
      description: '同花顺'
    })
  }

  addSpecialEvent(event: SpecialEvent): void {
    if (!this.currentGame) return

    this.currentGame.specialEvents.push(event)
  }

  incrementRound(): void {
    if (!this.currentGame) return

    this.currentGame.totalRounds += 1
  }

  setGameResult(
    winningTeam: 'team_a' | 'team_b',
    finalScore: { team_a: number; team_b: number },
    levelReached: number
  ): void {
    if (!this.currentGame) return

    this.currentGame.participants.forEach((participant) => {
      participant.is_winner = participant.team === winningTeam
    })
  }

  calculatePerformanceScore(userId: string): number {
    if (!this.currentGame) return 0

    const participant = this.currentGame.participants.get(userId)
    if (!participant) return 0

    let score = 50

    if (participant.is_winner) {
      score += 20
    }

    score += Math.min(participant.bombs_played * 2, 10)
    score += Math.min(participant.rockets_played * 5, 15)
    score += Math.min(participant.straights_played * 1, 5)
    score += Math.min(participant.aircraft_played * 2, 10)

    return Math.min(score, 100)
  }

  determineMVP(): string | null {
    if (!this.currentGame) return null

    let maxScore = 0
    let mvpUserId: string | null = null

    this.currentGame.participants.forEach((participant, userId) => {
      const score = this.calculatePerformanceScore(userId)
      if (score > maxScore) {
        maxScore = score
        mvpUserId = userId
      }
    })

    return mvpUserId
  }

  calculateLevelChange(userId: string, isWinner: boolean): number {
    if (!this.currentGame) return 0

    const participant = this.currentGame.participants.get(userId)
    if (!participant) return 0

    const baseChange = isWinner ? 1 : -1

    const performanceBonus = Math.floor(participant.performance_score / 20)

    return baseChange + performanceBonus
  }

  calculateRankPointsChange(userId: string, isWinner: boolean): number {
    if (!this.currentGame) return 0

    const participant = this.currentGame.participants.get(userId)
    if (!participant) return 0

    const baseChange = isWinner ? 25 : -10

    const performanceBonus = Math.floor(participant.performance_score / 10)

    return baseChange + performanceBonus
  }

  async finishGame(
    winningTeam: 'team_a' | 'team_b',
    finalScore: { team_a: number; team_b: number },
    levelReached: number
  ): Promise<boolean> {
    if (!this.currentGame) return false

    try {
      const mvpUserId = this.determineMVP()

      const participants: GameParticipantInput[] = Array.from(
        this.currentGame.participants.values()
      ).map((participant) => {
        const isWinner = participant.team === winningTeam
        const performanceScore = this.calculatePerformanceScore(participant.user_id)
        const levelChange = this.calculateLevelChange(participant.user_id, isWinner)
        const rankPointsChange = this.calculateRankPointsChange(participant.user_id, isWinner)

        return {
          ...participant,
          is_winner: isWinner,
          performance_score: performanceScore,
          mvp: participant.user_id === mvpUserId,
          level_change: levelChange,
          rank_points_change: rankPointsChange
        }
      })

      const gameRecordInput: GameRecordInput = {
        room_id: this.currentGame.room_id,
        game_type: this.currentGame.game_type,
        game_mode: this.currentGame.game_mode,
        winning_team: winningTeam,
        final_score: finalScore,
        level_reached: levelReached,
        total_rounds: this.currentGame.totalRounds,
        total_cards_played: this.currentGame.totalCardsPlayed,
        total_bombs_played: this.currentGame.totalBombsPlayed,
        total_rocket_played: this.currentGame.totalRocketsPlayed,
        special_events: this.currentGame.specialEvents,
        participants
      }

      const result = await createGameRecord(gameRecordInput)

      this.currentGame = null

      return result !== null
    } catch (error) {
      logger.error('Error finishing game:', error)
      return false
    }
  }

  cancelGame(): void {
    this.currentGame = null
  }

  getCurrentGameInfo(): {
    room_id: string
    game_type: string
    game_mode: string
    started_at: Date
    participant_count: number
    total_rounds: number
  } | null {
    if (!this.currentGame) return null

    return {
      room_id: this.currentGame.room_id,
      game_type: this.currentGame.game_type,
      game_mode: this.currentGame.game_mode,
      started_at: this.currentGame.started_at,
      participant_count: this.currentGame.participants.size,
      total_rounds: this.currentGame.totalRounds
    }
  }

  isGameActive(): boolean {
    return this.currentGame !== null
  }
}

export const gameRecordService = GameRecordService.getInstance()
