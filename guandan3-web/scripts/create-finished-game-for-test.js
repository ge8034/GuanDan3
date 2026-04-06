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

async function createFinishedGame() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()

    // 获取有效用户
    const { rows: users } = await client.query('SELECT id FROM auth.users LIMIT 1')
    const userId = users[0]?.id
    if (!userId) {
      console.log('No valid user found')
      return
    }

    // 创建房间
    const roomId = uuidv4()
    await client.query(`
      INSERT INTO rooms (id, name, type, status, owner_uid, mode, visibility)
      VALUES ($1, '排名测试', 'practice', 'playing', $2, 'pve1v3', 'public')
    `, [roomId, userId])
    console.log(`Created room: ${roomId}`)

    // 添加玩家
    await client.query(`
      INSERT INTO room_members (room_id, seat_no, member_type, uid)
      VALUES ($1, 0, 'human', $2), ($1, 1, 'ai', NULL), ($1, 2, 'ai', NULL), ($1, 3, 'ai', NULL)
    `, [roomId, userId])
    console.log('Added members')

    // 创建已完成的游戏 - 座位1,2,3已完成（排名123），座位0还有牌（第4名）
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
    console.log(`\nTo cleanup: DELETE FROM room_members WHERE room_id = '${roomId}';`)
    console.log(`             DELETE FROM games WHERE room_id = '${roomId}';`)
    console.log(`             DELETE FROM rooms WHERE id = '${roomId}';`)

    // 验证创建结果
    const { rows: verify } = await client.query('SELECT status, state_public FROM games WHERE id = $1', [gameId])
    console.log(`\nVerification:`)
    console.log(`  Status: ${verify[0].status}`)
    console.log(`  Rankings: ${JSON.stringify(verify[0].state_public.rankings)}`)

  } catch (e) {
    console.log('Error:', e.message)
    console.log('Detail:', e.detail)
  } finally {
    await client.end()
  }
}

createFinishedGame().catch(console.error)
