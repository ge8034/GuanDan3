'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore, Card } from '@/lib/store/game'
import { useAuthStore } from '@/lib/store/auth'
import { supabase } from '@/lib/supabase/client'
import { decideMove } from '@/lib/game/ai'
import { useSound } from '@/lib/hooks/useSound'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'

export default function RoomPage() {
  const { roomId } = useParams() as { roomId: string }
  const router = useRouter()
  const { user } = useAuthStore()
  const { currentRoom, members, fetchRoom, subscribeRoom, joinRoom, toggleReady, leaveRoom, heartbeatRoomMember, sweepOfflineMembers } = useRoomStore()
  const { 
    gameId, status: gameStatus, turnNo, currentSeat, myHand, lastAction,
    fetchGame, subscribeGame, startGame, submitTurn, counts, rankings 
  } = useGameStore()
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
  const { playSound } = useSound()
  const { showToast, toastView } = useToast()
  const [authReady, setAuthReady] = useState(false)
  const [roomLoaded, setRoomLoaded] = useState(false)

  const getRankTitle = (seatNo: number) => {
    const index = rankings.indexOf(seatNo)
    if (index === 0) return '👑 头游'
    if (index === 1) return '🥈 二游'
    if (index === 2) return '🥉 三游'
    if (index === 3) return '🥔 末游'
    return null
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data: signInData } = await supabase.auth.signInAnonymously()
            if (signInData?.user) {
              useAuthStore.getState().setUser(signInData.user)
              break
            }
          } catch {
            if (attempt >= 2) break
            await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)))
          }
        }
      } else {
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          useAuthStore.getState().setUser(userData.user)
        }
      }
    })()
      .catch(() => {})
      .finally(() => {
        if (active) setAuthReady(true)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!roomId || !authReady) return
    let active = true
    setRoomLoaded(false)

    const unsubRoom = subscribeRoom(roomId)
    const unsubGame = subscribeGame(roomId)

    ;(async () => {
      await Promise.all([fetchRoom(roomId), fetchGame(roomId)])
      if (active) setRoomLoaded(true)
    })().catch(() => {
      if (active) setRoomLoaded(true)
    })

    return () => {
      active = false
      unsubRoom()
      unsubGame()
    }
  }, [roomId, authReady, fetchRoom, subscribeRoom, fetchGame, subscribeGame])

  const isOwner = currentRoom?.owner_uid === user?.id

  const recoverAttemptCountRef = useRef(0)
  const recoverInFlightRef = useRef(false)
  const gameRecoverAttemptCountRef = useRef(0)
  const gameRecoverInFlightRef = useRef(false)

  const [debugLog, setDebugLog] = useState<string[]>([])
  const addDebugLog = (msg: string) => setDebugLog(prev => [msg, ...prev].slice(0, 5))

  useEffect(() => {
    if (!roomId || !authReady || !roomLoaded) return
    const myMember = members.find(m => m.uid === user?.id)
    if (!myMember) return

    heartbeatRoomMember(roomId).catch(() => {})
    const heartbeatTimer = setInterval(() => {
      heartbeatRoomMember(roomId).catch(() => {})
    }, 5000)

    const sweepTimer = isOwner
      ? setInterval(() => {
          sweepOfflineMembers(roomId, 15).catch(() => {})
        }, 7000)
      : null

    return () => {
      clearInterval(heartbeatTimer)
      if (sweepTimer) clearInterval(sweepTimer)
    }
  }, [roomId, authReady, roomLoaded, members, user?.id, isOwner, heartbeatRoomMember, sweepOfflineMembers])

  useEffect(() => {
    if (!roomId || !authReady || !roomLoaded) return
    if (gameStatus !== 'playing') return
    const myMember = members.find(m => m.uid === user?.id)
    if (!myMember) return
    if (myHand.length > 0) return
    if (recoverInFlightRef.current) return
    if (recoverAttemptCountRef.current >= 2) return

    recoverAttemptCountRef.current += 1
    recoverInFlightRef.current = true

    const timer = setTimeout(async () => {
      try {
        await fetchRoom(roomId)
        await fetchGame(roomId)
      } finally {
        recoverInFlightRef.current = false
      }
    }, recoverAttemptCountRef.current === 1 ? 800 : 2000)

    return () => clearTimeout(timer)
  }, [roomId, authReady, roomLoaded, gameStatus, members, user?.id, myHand.length, fetchRoom, fetchGame])

  useEffect(() => {
    if (!roomId || !authReady || !roomLoaded) return
    if (currentRoom?.status !== 'playing') return
    const myMember = members.find(m => m.uid === user?.id)
    if (!myMember) return
    if (gameStatus === 'playing' && gameId) return
    if (gameRecoverInFlightRef.current) return
    if (gameRecoverAttemptCountRef.current >= 2) return

    gameRecoverAttemptCountRef.current += 1
    gameRecoverInFlightRef.current = true

    const timer = setTimeout(async () => {
      try {
        await fetchGame(roomId)
      } finally {
        gameRecoverInFlightRef.current = false
      }
    }, gameRecoverAttemptCountRef.current === 1 ? 500 : 1500)

    return () => clearTimeout(timer)
  }, [roomId, authReady, roomLoaded, currentRoom?.status, members, user?.id, gameStatus, gameId, fetchGame])

  // AI Auto-play Logic
  const isSubmittingRef = useRef(false)
  useEffect(() => {
    if (gameStatus !== 'playing') return
    
    // Check if I am the owner (responsible for AI)
    if (!isOwner) return

    // If members are not loaded yet, we can't decide.
    if (!members || members.length === 0) return

    const currentMember = members.find(m => m.seat_no === currentSeat)
    // console.log('AI Logic Check:', { currentSeat, memberType: currentMember?.member_type, isOwner })
    
    // Only proceed if it is strictly an AI turn
    if (currentMember?.member_type === 'ai') {
      addDebugLog(`AI 回合：座位 ${currentSeat}（等待 1.5 秒）`)
      const timer = setTimeout(async () => {
        // Double check state before submitting
        const freshState = useGameStore.getState()
        if (freshState.status === 'playing' && freshState.currentSeat === currentSeat) {
           if (isSubmittingRef.current) {
             addDebugLog('跳过：正在提交中')
             return
           }
           isSubmittingRef.current = true
           try {
             addDebugLog(`AI 回合：座位 ${currentSeat}（思考中）`)
             
             // 1. Get AI Hand
             const aiHand = await freshState.getAIHand(currentSeat)
             addDebugLog(`AI 手牌：${aiHand.length} 张`)

             // 2. Get Context (Last Action)
             const lastAction = await freshState.fetchLastTrickPlay()
             addDebugLog(`上下文：${lastAction ? '跟牌' : '领牌'}`)

             // 3. Decide Move
             const move = decideMove(aiHand, lastAction)
             addDebugLog(`决策：${move.type} ${move.cards?.length || 0} 张`)

             // 4. Submit
             const result = await freshState.submitTurn(move.type, move.cards)
             
             if (result?.error) {
               addDebugLog(`AI 提交失败：${result.error.message}`)
               console.error('AI 提交失败详情：', result.error)
             } else {
               addDebugLog('AI 提交成功')
             }
           } catch (e: any) {
             addDebugLog(`AI 提交异常：${e.message}`)
             console.error('AI 自动出牌异常：', e)
           } finally {
             isSubmittingRef.current = false
           }
        } else {
          addDebugLog(`AI 取消：状态已变化（座位 ${freshState.currentSeat}）`)
        }
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [gameStatus, currentSeat, turnNo, members, isOwner, submitTurn])

  const myMember = members.find(m => m.uid === user?.id)
  const mySeat = myMember?.seat_no ?? 0
  const isMyTurn = gameStatus === 'playing' && currentSeat === mySeat
  
  // Sound Effects Logic
  useEffect(() => {
    if (isMyTurn) {
      playSound('turn')
    }
  }, [isMyTurn, playSound])

  useEffect(() => {
    if (gameStatus === 'finished') {
      playSound('win')
    }
  }, [gameStatus, playSound])
  
  // Get current player type for debug
  const currentPlayerType = members.find(m => m.seat_no === currentSeat)?.member_type ?? '未知'

  const handleStart = async () => {
    try {
      await startGame(roomId)
    } catch (e) {
      showToast({
        message: '开始失败（请查看控制台）',
        kind: 'error',
        action: {
          label: '重试',
          onClick: () => {
            startGame(roomId).catch(() => {})
          }
        }
      })
    }
  }

  const copyRoomLink = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast({ message: '房间链接已复制', kind: 'success' })
    } catch {
      showToast({ message: '复制失败，请手动复制：' + url, kind: 'error', timeoutMs: 6000 })
    }
  }

  const handleCardClick = (id: number) => {
    setSelectedCardIds(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    )
  }

  const handlePlay = async () => {
    if (selectedCardIds.length === 0) {
      showToast({ message: '请选择要出的牌', kind: 'info' })
      return
    }
    const selectedCards = myHand.filter(c => selectedCardIds.includes(c.id))
    const result = await submitTurn('play', selectedCards)
    if (result?.error) {
      showToast({ message: `出牌失败: ${result.error.message}`, kind: 'error' })
    } else {
      playSound('play')
      setSelectedCardIds([])
    }
  }

  const handlePass = async () => {
    const result = await submitTurn('pass')
    if (result?.error) {
      showToast({ message: `过牌失败: ${result.error.message}`, kind: 'error' })
    } else {
      setSelectedCardIds([])
    }
  }

  const getSuitIcon = (suit: string) => {
    switch(suit) {
      case 'H': return '♥'
      case 'D': return '♦'
      case 'C': return '♣'
      case 'S': return '♠'
      case 'J': return '★'
      default: return suit
    }
  }

  const getCardColor = (card: Card) => {
    if (card.suit === 'H' || card.suit === 'D') return 'text-red-600'
    if (card.suit === 'J' && card.rank === 'hr') return 'text-red-600'
    return 'text-black'
  }

  const getRankDisplay = (card: Card) => {
    if (card.suit === 'J') {
      return card.rank === 'hr' ? '红' : '黑'
    }
    return card.rank
  }

  // --- UI Helper Component ---
  const PlayerAvatar = ({ 
    seatNo, 
    isCurrentTurn, 
    cardCount, 
    memberType,
    isMe,
    rankTitle,
    isReady,
    isOnline
  }: { 
    seatNo: number, 
    isCurrentTurn: boolean, 
    cardCount: number, 
    memberType: string,
    isMe: boolean,
    rankTitle: string | null,
    isReady: boolean,
    isOnline: boolean
  }) => {
    return (
      <div className={`flex flex-col items-center p-3 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl transition-all duration-300 ${isCurrentTurn ? 'scale-110 border-yellow-400/50 bg-black/60 z-20' : 'z-10'}`}>
        <div className="relative">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${isCurrentTurn ? 'border-yellow-400 bg-gray-700 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : 'border-gray-600 bg-gray-800'}`}>
            <span className="text-3xl filter drop-shadow-lg transform hover:scale-110 transition-transform cursor-default">
              {memberType === 'ai' ? '🤖' : '👤'}
            </span>
          </div>
          
          {/* Ready Checkmark */}
          {isReady && !rankTitle && currentRoom?.status === 'open' && (
             <div className="absolute -bottom-1 -right-1 bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-30 animate-in zoom-in">
               ✓
             </div>
          )}

          {memberType !== 'ai' && !isOnline && (
            <div className="absolute -bottom-1 -left-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-md z-30">
              离线
            </div>
          )}

          {/* Rank Badge */}
          {rankTitle && (
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-yellow-200 animate-bounce">
              {rankTitle.split(' ')[0]}
            </div>
          )}
          
          {/* Thinking Bubble */}
          {isCurrentTurn && !rankTitle && (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-black text-xs px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse z-30 font-bold border border-gray-200">
              思考中...
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-4 border-transparent border-t-white"></div>
            </div>
          )}
        </div>
  
        <div className="mt-2 text-center">
          <div className="font-bold text-sm text-gray-200 flex items-center justify-center gap-1 whitespace-nowrap">
            {isMe ? '我' : `座位 ${seatNo}`}
            {memberType === 'ai' && <span className="text-[10px] bg-blue-600 px-1 rounded text-white font-mono">AI</span>}
          </div>
          
          {!rankTitle ? (
            <div className={`text-xs font-mono mt-0.5 ${cardCount <= 5 ? 'text-red-400 font-bold animate-pulse' : 'text-gray-400'}`}>
              {cardCount} 张牌
            </div>
          ) : (
            <div className="text-yellow-400 font-bold text-xs mt-0.5 drop-shadow-md">
              {rankTitle.split(' ')[1]}
            </div>
          )}
        </div>
      </div>
    )
  }

  const [isDebugVisible, setIsDebugVisible] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-green-800 text-white overflow-hidden font-sans relative">
      {toastView}
      
      {/* Join Overlay for PVP */}
      {authReady && roomLoaded && !currentRoom && (
        <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-2">房间不存在或已关闭</h2>
            <p className="text-gray-600 mb-6">
              请确认房间链接是否正确，或返回大厅重新加入。
            </p>
            <button
              onClick={() => router.push('/lobby')}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
            <button
              onClick={copyRoomLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition shadow mb-3"
            >
              复制房间链接
            </button>
            <button
              onClick={() => router.refresh()}
              data-testid="room-overlay-refresh"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              刷新重试
            </button>
          </div>
        </div>
      )}

      {authReady && roomLoaded && currentRoom?.status === 'open' && !myMember && members.length >= 4 && (
        <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-2">房间已满</h2>
            <p className="text-gray-600 mb-6">
              房间：{currentRoom.name || '未命名'}
              <br />
              玩家：{members.length}/4
            </p>
            <button
              onClick={() => router.push('/lobby')}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
            <button
              onClick={copyRoomLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition shadow mb-3"
            >
              复制房间链接
            </button>
            <button
              onClick={() => router.refresh()}
              data-testid="room-overlay-refresh"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              刷新重试
            </button>
          </div>
        </div>
      )}

      {authReady && roomLoaded && currentRoom?.status === 'open' && !myMember && members.length < 4 && (
        <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
            <h2 className="text-3xl font-bold mb-2">加入对局？</h2>
            <p className="text-gray-600 mb-6">
              房间：{currentRoom.name || '未命名'}
              <br/>
              玩家：{members.length}/4
            </p>
            <button 
              onClick={() =>
                joinRoom(roomId)
                  .then(() => heartbeatRoomMember(roomId).catch(() => {}))
                  .catch((e: any) => {
                    showToast({
                      message: mapSupabaseErrorToMessage(e, '加入失败'),
                      kind: 'error',
                      action: {
                        label: '重试',
                        onClick: () => {
                          joinRoom(roomId)
                            .then(() => heartbeatRoomMember(roomId).catch(() => {}))
                            .catch(() => {})
                        }
                      }
                    })
                  })
              }
              data-testid="room-overlay-join"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg mb-3"
            >
              加入座位
            </button>
            <button
              onClick={copyRoomLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition shadow mb-3"
            >
              复制房间链接
            </button>
            <button
              onClick={() => router.push('/lobby')}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition shadow-lg mb-3"
            >
              返回大厅
            </button>
            <button 
              onClick={() => window.history.back()}
              data-testid="room-overlay-cancel"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              取消并返回
            </button>
          </div>
        </div>
      )}

      {authReady && roomLoaded && currentRoom?.status === 'playing' && !myMember && (
        <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-2">无法加入进行中的对局</h2>
            <p className="text-gray-600 mb-6">
              你当前账号不是该房间成员，无法在对局进行中加入。
            </p>
            <button
              onClick={() => router.push('/lobby')}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
            <button
              onClick={copyRoomLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition shadow mb-3"
            >
              复制房间链接
            </button>
            <button
              onClick={() => router.refresh()}
              data-testid="room-overlay-refresh"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              刷新重试
            </button>
          </div>
        </div>
      )}

      {authReady && roomLoaded && currentRoom?.status === 'closed' && (
        <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white text-black p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
            <h2 className="text-2xl font-bold mb-2">房间已关闭</h2>
            <p className="text-gray-600 mb-6">
              该房间已结束或已被关闭，请返回大厅重新加入。
            </p>
            <button
              onClick={() => router.push('/lobby')}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-indigo-700 transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
            <button
              onClick={copyRoomLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-50 transition shadow mb-3"
            >
              复制房间链接
            </button>
            <button
              onClick={() => router.refresh()}
              data-testid="room-overlay-refresh"
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              刷新重试
            </button>
          </div>
        </div>
      )}

      {/* DEBUG INFO TOGGLE */}
      <button 
        onClick={() => setIsDebugVisible(!isDebugVisible)}
        className="fixed top-16 right-2 z-[9999] bg-black/50 text-white text-xs px-2 py-1 rounded hover:bg-black/70"
      >
        {isDebugVisible ? '隐藏调试' : '调试'}
      </button>

      {/* DEBUG INFO PANEL */}
      {isDebugVisible && (
        <div className="fixed top-24 right-2 bg-black/90 text-green-400 p-2 rounded text-[10px] z-[9999] shadow-xl border border-green-500/30 max-w-[200px]">
          <div className="font-bold mb-1 border-b border-gray-600">调试面板</div>
          <div>回合号：{turnNo}</div>
          <div>当前座位：{currentSeat}（{currentPlayerType}）</div>
          <div>我的座位：{myMember?.seat_no ?? '无'}</div>
          <div>是否我方回合：{isMyTurn ? '是' : '否'}</div>
          <div>是否房主：{isOwner ? '是' : '否'}</div>
          <div className="mt-1 border-t border-gray-600 pt-1">
            <div className="font-bold">恢复：</div>
            <div>手牌：{recoverAttemptCountRef.current} / 2（{recoverInFlightRef.current ? '进行中' : '空闲'}）</div>
            <div>对局：{gameRecoverAttemptCountRef.current} / 2（{gameRecoverInFlightRef.current ? '进行中' : '空闲'}）</div>
          </div>
          <div className="mt-1 border-t border-gray-600 pt-1">
            <div className="font-bold">日志：</div>
            {debugLog.map((l, i) => <div key={i} className="truncate">{l}</div>)}
          </div>
          {isOwner && currentPlayerType === 'ai' && (
            <button 
              onClick={async () => {
                try {
                  addDebugLog('强制：提交中...');
                  const res = await submitTurn('pass');
                  if (res?.error) {
                     addDebugLog(`强制错误：${res.error.message}`);
                     showToast({ message: `强制错误：${res.error.message}`, kind: 'error' })
                     // If turn mismatch, try to refresh explicitly
                     if (res.error.message?.includes('turn_no_mismatch')) {
                        await fetchGame(roomId)
                     }
                  } else {
                     addDebugLog('强制：成功');
                     await fetchGame(roomId); // Force refresh
                  }
                } catch (e: any) {
                  addDebugLog(`强制错误：${e.message}`);
                  showToast({ message: `错误：${e.message}`, kind: 'error' })
                }
              }}
              className="mt-2 w-full bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
            >
              强制 AI 过牌
            </button>
          )}
        </div>
      )}

      {/* Game Over Overlay */}
      {gameStatus === 'finished' && (
        <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center backdrop-blur-md">
          <div className="bg-gradient-to-br from-yellow-900 to-black border-2 border-yellow-500 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-4xl font-bold text-yellow-400 mb-6 drop-shadow-md">游戏结束</h2>
            <div className="space-y-4">
              {rankings.map((seat, index) => (
                <div key={seat} className="flex justify-between items-center bg-white/10 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🥔'}
                    </span>
                    <span className="font-bold text-lg text-white">
                      {seat === mySeat ? '我' : `座位 ${seat}`}
                    </span>
                  </div>
                  <span className="text-yellow-200 font-mono font-bold">
                    {index === 0 ? '头游' : index === 1 ? '二游' : index === 2 ? '三游' : '末游'}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center gap-4">
               {isOwner ? (
                 <button 
                  onClick={handleStart} 
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
                >
                  再来一局
                </button>
               ) : (
                 <div className="text-white/60">等待房主开始新游戏...</div>
               )}
            </div>
          </div>
        </div>
      )}

      <header className="p-4 bg-green-900 flex justify-between items-center shadow-md z-10">
        <div>
          <h1 className="text-xl font-bold">房间：{roomId?.slice(0,8)}...</h1>
          <p className="text-xs opacity-70">
            状态：{currentRoom?.status} | 牌局：{gameStatus} | 座位：{myMember?.seat_no ?? '?'}
          </p>
        </div>
        <div className="flex gap-2">
           {currentRoom?.status === 'open' && (
             <button
                onClick={async () => {
                  if (confirm('确定要离开房间吗？')) {
                    try {
                      await leaveRoom(roomId)
                      router.push('/lobby')
                    } catch (e: any) {
                      showToast({ message: mapSupabaseErrorToMessage(e, '离开房间失败'), kind: 'error' })
                    }
                  }
                }}
                className="bg-red-900/50 hover:bg-red-800 text-white px-3 py-2 rounded text-sm transition border border-red-800"
             >
               离开房间
             </button>
           )}
           {currentRoom?.status === 'open' && isOwner && (
             <button 
               onClick={handleStart}
               disabled={currentRoom.mode === 'pvp4' && members.length < 4}
               className="bg-yellow-500 px-4 py-2 rounded text-black font-bold hover:bg-yellow-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {currentRoom.mode === 'pvp4' && members.length < 4 
                 ? `等待玩家（${members.length}/4）` 
                 : '开始游戏'}
             </button>
           )}
           {gameStatus === 'playing' && (
             <div className="bg-blue-600 px-3 py-1 rounded text-sm">
               回合：座位 {currentSeat}
             </div>
           )}
        </div>
      </header>
      
      <main className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr_auto] w-full h-full relative z-0">
        {/* Row 1: Top (Opposite) - 对家 */}
        <div className="col-start-2 row-start-1 flex justify-center pt-4 pb-2 z-10">
           {(() => {
             const seat = (mySeat + 2) % 4
             const member = members.find(m => m.seat_no === seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={member?.member_type === 'ai' ? true : (member?.online ?? true)}
               />
             )
           })()}
        </div>

        {/* Row 2 Left: Left (Previous) - 上家 */}
        <div className="col-start-1 row-start-2 flex items-center justify-start pl-4 z-10">
           {(() => {
             const seat = (mySeat + 3) % 4
             const member = members.find(m => m.seat_no === seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={member?.member_type === 'ai' ? true : (member?.online ?? true)}
               />
             )
           })()}
        </div>

        {/* Row 2 Center: Table Area (Last Action) */}
        <div className="col-start-2 row-start-2 flex justify-center items-center z-0">
          <div className="w-full max-w-sm h-48 bg-green-700/30 rounded-xl flex flex-col items-center justify-center border-4 border-green-600/20 relative transition-all duration-300">
            {currentRoom?.status === 'open' ? (
               <div className="text-center">
                 <div className="text-white/60 mb-4 font-mono text-sm">
                   等待玩家加入...（{members.length}/4）
                 </div>
                 {myMember && (
                    <button
                      onClick={() => toggleReady(roomId, !myMember.ready)}
                      className={`px-8 py-3 rounded-full font-bold shadow-xl transition transform active:scale-95 ${
                        myMember.ready 
                          ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                          : 'bg-green-500 text-white hover:bg-green-400 scale-110'
                      }`}
                    >
                      {myMember.ready ? '取消准备' : '准备'}
                    </button>
                 )}
               </div>
            ) : lastAction ? (
              <>
                <div className="absolute top-2 left-3 text-xs font-mono text-green-200 bg-black/30 px-2 py-1 rounded">
                   上一手：{lastAction.seatNo === mySeat ? '我' : `座位 ${lastAction.seatNo}`}
                </div>
                {lastAction.type === 'pass' ? (
                   <div className="text-white/40 text-3xl font-bold tracking-widest animate-pulse">过牌</div>
                ) : (
                   <div className="flex -space-x-8 px-8 py-2 overflow-x-auto max-w-full justify-center">
                     {lastAction.cards?.map((card, i) => (
                       <div 
                         key={i}
                         className="w-20 h-28 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-1.5 transform hover:-translate-y-2 transition-transform"
                       >
                          <div className={`text-sm font-bold w-full text-left leading-none ${getCardColor(card)}`}>{getRankDisplay(card)}</div>
                          <div className={`text-3xl ${getCardColor(card)}`}>{getSuitIcon(card.suit)}</div>
                          <div className={`text-sm font-bold w-full text-right leading-none ${getCardColor(card)}`}>{getRankDisplay(card)}</div>
                        </div>
                      ))}
                    </div>
                 )}
              </>
            ) : (
              <div className="flex flex-col items-center opacity-20">
                <div className="text-green-300 text-6xl mb-2">♣</div>
                <div className="text-green-300 text-sm font-mono">新一轮</div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 Right: Right (Next) - 下家 */}
        <div className="col-start-3 row-start-2 flex items-center justify-end pr-4 z-10">
           {(() => {
             const seat = (mySeat + 1) % 4
             const member = members.find(m => m.seat_no === seat)
             return (
               <PlayerAvatar 
                 seatNo={seat}
                 isCurrentTurn={currentSeat === seat}
                 cardCount={counts[seat] ?? 27}
                 memberType={member?.member_type ?? 'unknown'}
                 isMe={false}
                 rankTitle={getRankTitle(seat)}
                 isReady={member?.ready ?? false}
                 isOnline={member?.member_type === 'ai' ? true : (member?.online ?? true)}
               />
             )
           })()}
        </div>

        {/* Row 3: My Hand (In Grid Flow) */}
        <div className="col-start-1 col-span-3 row-start-3 w-full h-64 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 to-transparent z-20 relative">
          
          {/* My Avatar (Bottom Left Overlay) */}
          <div className="absolute bottom-4 left-4 z-30 transform scale-75 origin-bottom-left opacity-80 hover:opacity-100 transition-opacity">
             <PlayerAvatar 
               seatNo={mySeat}
               isCurrentTurn={isMyTurn}
               cardCount={myHand.length}
               memberType="human"
               isMe={true}
               rankTitle={getRankTitle(mySeat)}
               isReady={myMember?.ready ?? false}
               isOnline={myMember?.online ?? true}
             />
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-4 z-20">
            {isMyTurn && (
              <>
                <button 
                  onClick={handlePlay}
                  disabled={selectedCardIds.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95"
                >
                  出牌
                </button>
                <button 
                  onClick={handlePass}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95"
                >
                  过牌
                </button>
              </>
            )}
          </div>

          {/* 手牌 */}
          <div className="flex justify-center -space-x-12 hover:-space-x-8 transition-all duration-300 pb-4 overflow-x-auto px-12">
            {rankings.includes(mySeat) ? (
               <div className="flex flex-col items-center justify-center h-32 animate-in zoom-in">
                 <div className="text-6xl mb-2">{rankings.indexOf(mySeat) === 0 ? '👑' : rankings.indexOf(mySeat) === 1 ? '🥈' : rankings.indexOf(mySeat) === 2 ? '🥉' : '🥔'}</div>
                 <div className="text-2xl font-bold text-yellow-400 drop-shadow-md">
                   {getRankTitle(mySeat)}
                 </div>
                 <div className="text-white/60 text-sm mt-1">等待其他玩家...</div>
               </div>
            ) : (
              <>
                {myHand.length === 0 && gameStatus === 'playing' && !rankings.includes(mySeat) ? (
                   // 手牌为空但尚未进入排名，等待服务端状态更新
                   <div className="text-white/50 animate-pulse">正在确认终局状态...</div>
                ) : (
                  myHand.map((card, i) => (
                  <div 
                    key={card.id} 
                    onClick={() => isMyTurn && handleCardClick(card.id)}
                    className={`w-24 h-36 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-2 transform hover:-translate-y-8 transition-transform cursor-pointer relative shrink-0 ${
                      selectedCardIds.includes(card.id) ? '-translate-y-8 ring-4 ring-yellow-400' : ''
                    }`}
                    style={{ zIndex: i }}
                  >
                     <div className={`text-lg font-bold w-full text-left ${getCardColor(card)}`}>
                       {getRankDisplay(card)}
                     </div>
                     <div className={`text-5xl ${getCardColor(card)}`}>
                       {getSuitIcon(card.suit)}
                     </div>
                     <div className={`text-lg font-bold w-full text-right ${getCardColor(card)}`}>
                       {getRankDisplay(card)}
                     </div>
                  </div>
                ))
                )}
              </>
            )}
          </div>
          
        </div>
      </main>
    </div>
  )
}
