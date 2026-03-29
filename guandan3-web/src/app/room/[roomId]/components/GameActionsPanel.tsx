import { Button } from '@/components/ui/button'
import { Play, Pass, Pause, PlayCircle } from 'lucide-react'

/**
 * 游戏操作面板组件
 *
 * 包含出牌、不出牌、暂停、恢复等按钮
 */
interface GameActionsPanelProps {
  isMyTurn: boolean
  canPlay: boolean
  selectedCount: number
  onPlay: () => void
  onPass: () => void
  onPause: () => void
  onResume: () => void
  gameStatus: 'deal' | 'playing' | 'paused' | 'finished'
  isOwner: boolean
}

export function GameActionsPanel({
  isMyTurn,
  canPlay,
  selectedCount,
  onPlay,
  onPass,
  onPause,
  onResume,
  gameStatus,
  isOwner,
}: GameActionsPanelProps) {
  const isPaused = gameStatus === 'paused'

  return (
    <div className="flex gap-2">
      {isMyTurn && gameStatus === 'playing' && (
        <>
          <Button
            onClick={onPlay}
            disabled={!canPlay || selectedCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-1" />
            出牌
          </Button>
          <Button
            onClick={onPass}
            variant="outline"
            disabled={false}
          >
            <Pass className="w-4 h-4 mr-1" />
            不出
          </Button>
        </>
      )}

      {isOwner && gameStatus === 'playing' && !isPaused && (
        <Button
          onClick={onPause}
          variant="outline"
          size="sm"
        >
          <Pause className="w-4 h-4 mr-1" />
          暂停
        </Button>
      )}

      {isOwner && isPaused && (
        <Button
          onClick={onResume}
          variant="outline"
          size="sm"
        >
          <PlayCircle className="w-4 h-4 mr-1" />
          恢复
        </Button>
      )}
    </div>
  )
}
