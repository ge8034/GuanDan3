'use client'

import RippleEffect from '@/components/effects/RippleEffect'

export type RoomOverlaysProps = {
  authReady: boolean
  roomLoaded: boolean
  hasRoom: boolean
  roomStatus?: string | null
  roomName?: string | null
  isMember: boolean
  membersCount: number
  onBackLobby: () => void
  onCopyLink: () => void
  onRefresh: () => void
  onJoin: () => void
  onCancelBack: () => void
}

export const RoomOverlays = ({
  authReady,
  roomLoaded,
  hasRoom,
  roomStatus,
  roomName,
  isMember,
  membersCount,
  onBackLobby,
  onCopyLink,
  onRefresh,
  onJoin,
  onCancelBack,
}: RoomOverlaysProps) => {
  if (!authReady || !roomLoaded) return null

  if (!hasRoom) {
    return (
      <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <h2 className="text-2xl font-bold mb-2">房间不存在或已关闭</h2>
          <p className="text-gray-600 mb-6">请确认房间链接是否正确，或返回大厅重新加入。</p>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onBackLobby}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-[#6BA539] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5a9432] transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onCopyLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-[#D3D3D3] text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-[#F5F5DC] transition shadow mb-3"
            >
              复制房间链接
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block">
            <button onClick={onRefresh} data-testid="room-overlay-refresh" className="text-gray-500 hover:text-gray-700 text-sm underline">
              刷新重试
            </button>
          </RippleEffect>
        </div>
      </div>
    )
  }

  if (roomStatus === 'open' && !isMember && membersCount >= 4) {
    return (
      <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <h2 className="text-2xl font-bold mb-2">房间已满</h2>
          <p className="text-gray-600 mb-6">
            房间：{roomName || '未命名'}
            <br />
            玩家：{membersCount}/4
          </p>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onBackLobby}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-[#6BA539] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5a9432] transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onCopyLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-[#D3D3D3] text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-[#F5F5DC] transition shadow mb-3"
            >
              复制房间链接
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block">
            <button onClick={onRefresh} data-testid="room-overlay-refresh" className="text-gray-500 hover:text-gray-700 text-sm underline">
              刷新重试
            </button>
          </RippleEffect>
        </div>
      </div>
    )
  }

  if (roomStatus === 'open' && !isMember && membersCount < 4) {
    return (
      <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <h2 className="text-3xl font-bold mb-2">加入对局？</h2>
          <p className="text-gray-600 mb-6">
            房间：{roomName || '未命名'}
            <br />
            玩家：{membersCount}/4
          </p>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onJoin}
              data-testid="room-overlay-join"
              className="w-full bg-[#6BA539] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5a9432] transition transform hover:scale-105 shadow-lg mb-3"
            >
              加入座位
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onCopyLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-[#D3D3D3] text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-[#F5F5DC] transition shadow mb-3"
            >
              复制房间链接
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onBackLobby}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-gray-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition shadow-lg mb-3"
            >
              返回大厅
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block">
            <button onClick={onCancelBack} data-testid="room-overlay-cancel" className="text-gray-500 hover:text-gray-700 text-sm underline">
              取消并返回
            </button>
          </RippleEffect>
        </div>
      </div>
    )
  }

  if (roomStatus === 'playing' && !isMember) {
    return (
      <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <h2 className="text-2xl font-bold mb-2">无法加入进行中的对局</h2>
          <p className="text-gray-600 mb-6">你当前账号不是该房间成员，无法在对局进行中加入。</p>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onBackLobby}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-[#6BA539] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5a9432] transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onCopyLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-[#D3D3D3] text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-[#F5F5DC] transition shadow mb-3"
            >
              复制房间链接
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block">
            <button onClick={onRefresh} data-testid="room-overlay-refresh" className="text-gray-500 hover:text-gray-700 text-sm underline">
              刷新重试
            </button>
          </RippleEffect>
        </div>
      </div>
    )
  }

  if (roomStatus === 'closed') {
    return (
      <div className="fixed inset-0 z-[50] bg-black/60 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in duration-300">
          <h2 className="text-2xl font-bold mb-2">房间已关闭</h2>
          <p className="text-gray-600 mb-6">该房间已结束或已被关闭，请返回大厅重新加入。</p>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onBackLobby}
              data-testid="room-overlay-back-lobby"
              className="w-full bg-[#6BA539] text-white font-bold py-3 px-6 rounded-xl hover:bg-[#5a9432] transition transform hover:scale-105 shadow-lg mb-3"
            >
              返回大厅
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block w-full">
            <button
              onClick={onCopyLink}
              data-testid="room-overlay-copy-link"
              className="w-full border border-[#D3D3D3] text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-[#F5F5DC] transition shadow mb-3"
            >
              复制房间链接
            </button>
          </RippleEffect>
          <RippleEffect className="relative inline-block">
            <button onClick={onRefresh} data-testid="room-overlay-refresh" className="text-gray-500 hover:text-gray-700 text-sm underline">
              刷新重试
            </button>
          </RippleEffect>
        </div>
      </div>
    )
  }

  return null
}

