export const modeLabel = (mode: string): string => {
  if (mode === 'pvp4') return '4人对战'
  if (mode === 'pve1v3') return '练习房'
  return mode
}

export const typeLabel = (type: string): string => {
  if (type === 'classic') return '经典'
  return type
}

export const sortRooms = (rooms: any[]): any[] => {
  return rooms.slice().sort((a, b) => {
    const aMembers = (a?.room_members || []) as Array<{ online?: boolean }>
    const bMembers = (b?.room_members || []) as Array<{ online?: boolean }>
    const aCount = aMembers.length
    const bCount = bMembers.length
    const aJoinable = aCount < 4 ? 1 : 0
    const bJoinable = bCount < 4 ? 1 : 0
    if (aJoinable !== bJoinable) return bJoinable - aJoinable

    const aOnline = aMembers.filter(m => m?.online === true).length
    const bOnline = bMembers.filter(m => m?.online === true).length
    if (aOnline !== bOnline) return bOnline - aOnline

    const aTs = a?.created_at ? Date.parse(a.created_at) : 0
    const bTs = b?.created_at ? Date.parse(b.created_at) : 0
    return bTs - aTs
  })
}
