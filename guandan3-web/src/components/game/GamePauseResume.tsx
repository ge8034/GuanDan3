'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useShallow } from 'zustand/shallow'
import { useGameStore } from '@/lib/store/game'
import { useToast } from '@/lib/hooks/useToast'
import { PauseIcon, PlayIcon } from '@/components/icons/LandscapeIcons'

interface GamePauseResumeProps {
  roomId: string
  isOwner: boolean
}

export default function GamePauseResume({ roomId, isOwner }: GamePauseResumeProps) {
  const [showPauseDialog, setShowPauseDialog] = useState(false)
  const [inputPauseReason, setInputPauseReason] = useState('')
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  // 使用 useShallow 减少不必要的重渲染
  const { status, pausedBy, pausedAt, pauseReason, pauseGame, resumeGame } = useGameStore(
    useShallow((s) => ({
      status: s.status,
      pausedBy: s.pausedBy,
      pausedAt: s.pausedAt,
      pauseReason: s.pauseReason,
      pauseGame: s.pauseGame,
      resumeGame: s.resumeGame,
    }))
  )

  const { showToast } = useToast()

  const handlePause = async () => {
    if (!isOwner) {
      showToast({ message: '只有房主可以暂停游戏', kind: 'error' })
      return
    }

    try {
      await pauseGame(inputPauseReason || '手动暂停')
      setShowPauseDialog(false)
      setInputPauseReason('')
      showToast({ message: '游戏已暂停', kind: 'success' })
    } catch (error: any) {
      showToast({ message: `暂停失败: ${error.message}`, kind: 'error' })
    }
  }

  const handleResume = async () => {
    if (!isOwner) {
      showToast({ message: '只有房主可以恢复游戏', kind: 'error' })
      return
    }

    try {
      await resumeGame()
      setShowResumeDialog(false)
      showToast({ message: '游戏已恢复', kind: 'success' })
    } catch (error: any) {
      showToast({ message: `恢复失败: ${error.message}`, kind: 'error' })
    }
  }

  const formatPauseTime = (time: string | null) => {
    if (!time) return ''
    const date = new Date(time)
    return date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <AnimatePresence>
        {status === 'paused' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <PauseIcon size="md" />
            <div className="text-center">
              <div className="font-bold">游戏已暂停</div>
              {pausedAt && (
                <div className="text-xs opacity-80">
                  暂停时间: {formatPauseTime(pausedAt)}
                </div>
              )}
              {pauseReason && (
                <div className="text-xs opacity-80">
                  原因: {pauseReason}
                </div>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setShowResumeDialog(true)}
                className="bg-white text-yellow-500 px-4 py-2 rounded-lg font-bold hover:bg-yellow-50 transition-colors"
              >
                <PlayIcon size="sm" />
                恢复游戏
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isOwner && status === 'playing' && (
        <button
          onClick={() => setShowPauseDialog(true)}
          className="fixed top-4 left-4 z-50 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <PauseIcon size="sm" />
          暂停游戏
        </button>
      )}

      <AnimatePresence>
        {showPauseDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPauseDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                暂停游戏
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  暂停原因（可选）
                </label>
                <textarea
                  value={inputPauseReason}
                  onChange={(e) => setInputPauseReason(e.target.value)}
                  placeholder="请输入暂停原因..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPauseDialog(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handlePause}
                  className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  确认暂停
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResumeDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowResumeDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                恢复游戏
              </h3>
              
              <div className="mb-6 text-gray-600 dark:text-gray-400">
                确定要恢复游戏吗？所有玩家将可以继续游戏。
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowResumeDialog(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleResume}
                  className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  确认恢复
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
