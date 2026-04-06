const { Client } = require('pg')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function createFinishedGameWithAnonymousUser() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()

    // 创建房间 - 使用 anonymous 用户作为 owner
    const roomId = uuidv4()
    const anonUserId = '00000000-0000-0000-0000-000000000000'

    // 首先在 auth.users 中创建或找到匿名用户
    const { rows: existingUsers } = await client.query("SELECT id FROM auth.users WHERE id = $1", [anonUserId])
    let userId = anonUserId

    if (existingUsers.length === 0) {
      // 如果没有匿名用户，使用第一个可用用户
      const { rows: users } = await client.query('SELECT id FROM auth.users LIMIT 1')
      userId = users[0]?.id
      if (!userId) throw new Error('No users found')
    }

    await client.query(`
      INSERT INTO rooms (id, name, type, status, owner_uid, mode, visibility)
      VALUES ($1, '排名测试房间', 'practice', 'playing', $2, 'pve1v3', 'public')
    `, [roomId, userId])
    console.log(`Created room: ${roomId}`)

    // 添加玩家（使用空 UID 表示匿名用户，seat 0）
    await client.query(`
      INSERT INTO room_members (room_id, seat_no, member_type, uid)
      VALUES
        ($1, 0, 'human', NULL),
        ($1, 1, 'ai', NULL),
        ($1, 2, 'ai', NULL),
        ($1, 3, 'ai', NULL)
    `, [roomId])
    console.log('Added members (seat 0 = anonymous human)')

    // 创建已完成的游戏
    const gameId = uuidv4()
    const statePublic = {
      counts: [27, 0, 0, 0],
      rankings: [1, 2, 3],
      levelRank: 2
    }
    const statePrivate = {
      hands: {
        '0': Array.from({ length: 27 }, (_, i) => ({ id: i, suit: ['H', 'D', 'C', 'S'][i % 4], rank: String(i % 13), val: 12 - (i % 13) })),
        '1': [],
        '2': [],
        '3': []
      }
    }

    await client.query(`
      INSERT INTO games (id, room_id, status, turn_no, current_seat, state_public, state_private, seed)
      VALUES ($1, $2, 'finished', 100, 0, $3, $4, $5)
    `, [gameId, roomId, JSON.stringify(statePublic), JSON.stringify(statePrivate), Math.floor(Math.random() * 1000000)])

    console.log(`Created finished game: ${gameId}`)
    console.log(`Rankings: [1, 2, 3]`)
    console.log(`\nAccess URL: http://localhost:3000/room/${roomId}`)
    console.log(`\nCleanup SQL:`)
    console.log(`  DELETE FROM room_members WHERE room_id = '${roomId}';`)
    console.log(`  DELETE FROM games WHERE room_id = '${roomId}';`)
    console.log(`  DELETE FROM rooms WHERE id = '${roomId}';`)

    // 验证
    const { rows: verify } = await client.query('SELECT status, state_public FROM games WHERE id = $1', [gameId])
    console.log(`\nVerification:`)
    console.log(`  Status: ${verify[0].status}`)
    console.log(`  Rankings: ${JSON.stringify(verify[0].state_public.rankings)}`)

    console.log(`\n✅ 测试房间已创建，使用此 URL 运行测试:`)
    console.log(`   ROOM_ID=${roomId}`)

  } catch (e) {
    console.log('Error:', e.message)
    console.log('Detail:', e.detail)
  } finally {
    await client.end()
  }
}

createFinishedGameWithAnonymousUser().catch(console.error)
