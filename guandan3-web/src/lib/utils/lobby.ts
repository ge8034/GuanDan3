/**
 * 获取游戏模式标签
 *
 * 将游戏模式代码转换为中文显示名称
 *
 * @param mode - 游戏模式代码 ('pvp4' | 'pve1v3' 等)
 * @returns 中文模式名称
 *
 * @example
 * ```ts
 * modeLabel('pvp4')  // 返回 '4人对战'
 * modeLabel('pve1v3') // 返回 '练习房'
 * modeLabel('unknown') // 返回 'unknown'
 * ```
 */
export const modeLabel = (mode: string): string => {
  if (mode === 'pvp4') return '4人对战'
  if (mode === 'pve1v3') return '练习房'
  return mode
}

/**
 * 获取房间类型标签
 *
 * 将房间类型代码转换为中文显示名称
 *
 * @param type - 房间类型代码
 * @returns 中文类型名称
 *
 * @example
 * ```ts
 * typeLabel('classic') // 返回 '经典'
 * typeLabel('ranked')  // 返回 'ranked'
 * ```
 */
export const typeLabel = (type: string): string => {
  if (type === 'classic') return '经典'
  return type
}

/**
 * 房间排序函数
 *
 * 按照以下优先级对房间列表进行排序：
 * 1. 可加入房间优先（成员数 < 4）
 * 2. 在线人数多的优先
 * 3. 创建时间晚的优先
 *
 * @param rooms - 房间数组
 * @returns 排序后的房间数组（原数组不变）
 *
 * @example
 * ```ts
 * const rooms = [
 *   { id: '1', room_members: [{ online: true }], created_at: '2024-01-01' },
 *   { id: '2', room_members: [], created_at: '2024-01-02' }
 * ]
 * const sorted = sortRooms(rooms)
 * // 房间 2 排在前面（空房间，可加入）
 * ```
 */
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
