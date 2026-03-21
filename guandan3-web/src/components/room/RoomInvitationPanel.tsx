'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  createRoomInvitation, 
  getRoomInvitations, 
  generateInviteLink, 
  generateQRCodeUrl,
  type RoomInvitationCreateResult 
} from '@/lib/api/roomInvitation'
import { copyToClipboard } from '@/lib/utils/clipboard'
import RippleEffect from '@/components/effects/RippleEffect'

interface RoomInvitationPanelProps {
  roomId: string
  isOwner: boolean
}

export const RoomInvitationPanel = ({ roomId, isOwner }: RoomInvitationPanelProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [invitations, setInvitations] = useState<any[]>([])
  const [showInvitations, setShowInvitations] = useState(false)

  const handleCreateInvitation = async () => {
    setLoading(true)
    try {
      const { data, error } = await createRoomInvitation(roomId)
      if (error) {
        console.error('创建邀请失败:', error)
        return
      }

      if (data) {
        setInviteCode(data.invite_code)
        setInviteLink(generateInviteLink(data.invite_code))
        setQrCodeUrl(generateQRCodeUrl(data.invite_code))
      }
    } catch (error) {
      console.error('创建邀请失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (inviteLink) {
      await copyToClipboard(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyCode = async () => {
    if (inviteCode) {
      await copyToClipboard(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const loadInvitations = useCallback(async () => {
    if (!isOwner) return

    const { data } = await getRoomInvitations(roomId)
    if (data) {
      setInvitations(data)
    }
  }, [roomId, isOwner])

  useEffect(() => {
    if (showInvitations) {
      loadInvitations()
    }
  }, [showInvitations, loadInvitations])

  return (
    <div className="relative">
      <RippleEffect className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          data-testid="room-invitation-toggle"
          className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
        >
          <span>📨</span>
          <span>邀请</span>
        </button>
      </RippleEffect>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">房间邀请</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {inviteCode ? (
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">邀请码</span>
                      <RippleEffect className="relative inline-block">
                        <button
                          onClick={handleCopyCode}
                          className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                        >
                          {copied ? '已复制' : '复制'}
                        </button>
                      </RippleEffect>
                    </div>
                    <div className="bg-black/30 rounded px-3 py-2 text-white font-mono text-center">
                      {inviteCode}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">邀请链接</span>
                      <RippleEffect className="relative inline-block">
                        <button
                          onClick={handleCopyLink}
                          className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                        >
                          {copied ? '已复制' : '复制'}
                        </button>
                      </RippleEffect>
                    </div>
                    <div className="bg-black/30 rounded px-3 py-2 text-white text-xs break-all">
                      {inviteLink}
                    </div>
                  </div>

                  {qrCodeUrl && (
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center justify-center">
                        <Image
                          src={qrCodeUrl}
                          alt="邀请二维码"
                          width={128}
                          height={128}
                          className="w-32 h-32 rounded-lg"
                        />
                      </div>
                      <p className="text-white/50 text-xs text-center mt-2">
                        扫描二维码加入房间
                      </p>
                    </div>
                  )}

                  <RippleEffect className="relative inline-block">
                    <button
                      onClick={() => {
                        setInviteCode(null)
                        setInviteLink(null)
                        setQrCodeUrl(null)
                      }}
                      className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                    >
                      生成新邀请码
                    </button>
                  </RippleEffect>
                </div>
              ) : (
                <div className="space-y-3">
                  <RippleEffect className="relative inline-block">
                    <button
                      onClick={handleCreateInvitation}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold transition-colors"
                    >
                      {loading ? '生成中...' : '生成邀请码'}
                    </button>
                  </RippleEffect>

                  {isOwner && (
                    <RippleEffect className="relative inline-block">
                      <button
                        onClick={() => setShowInvitations(!showInvitations)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-sm transition-colors"
                      >
                        {showInvitations ? '隐藏' : '查看'}邀请记录
                      </button>
                    </RippleEffect>
                  )}

                  {showInvitations && isOwner && (
                    <div className="bg-white/5 rounded-lg p-3 max-h-40 overflow-y-auto custom-scrollbar">
                      {invitations.length === 0 ? (
                        <p className="text-white/50 text-xs text-center">
                          暂无邀请记录
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {invitations.map((inv) => (
                            <div
                              key={inv.invitation_id}
                              className="flex items-center justify-between text-xs"
                            >
                              <div className="flex-1">
                                <p className="text-white/70">
                                  {inv.invitee_nickname || '未指定用户'}
                                </p>
                                <p className="text-white/40">
                                  {inv.invite_code}
                                </p>
                              </div>
                              <div className={`px-2 py-1 rounded ${
                                inv.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                                inv.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                inv.status === 'expired' ? 'bg-gray-500/20 text-gray-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {inv.status === 'accepted' ? '已接受' :
                                 inv.status === 'rejected' ? '已拒绝' :
                                 inv.status === 'expired' ? '已过期' :
                                 '待处理'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
