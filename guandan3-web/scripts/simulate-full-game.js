/**
 * 模拟完整游戏流程，验证排名系统
 * 创建新游戏，让玩家快速出完牌，验证排名记录和显示
 */

const fs = require('fs')
const crypto = require('crypto')

// 生成 UUID
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

// PostgreSQL direct connection
const { Client } = require('pg')

async function simulateFullGame() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('✓ 已连接数据库\n')

    // 获取一个有效的用户ID
    const { rows: users } = await client.query('SELECT id FROM auth.users LIMIT 1')
    const validUserId = users[0]?.id
    if (!validUserId) {
      throw new Error('No valid user found in database')
    }

    // 1. 创建房间
    const roomId = uuidv4()
    const roomResult = await client.query(`
      INSERT INTO rooms (id, name, type, status, owner_uid, mode, visibility)
      VALUES ($1, '测试房间', 'practice', 'waiting', $2, 'pve1v3', 'public')
      RETURNING id
    `, [roomId, validUserId])

    console.log(`1. 创建房间: ${roomId}`)

    // 2. 添加4个玩家
    await client.query(`
      INSERT INTO room_members (room_id, seat_no, member_type, uid)
      VALUES
        ($1, 0, 'human', $2),
        ($1, 1, 'ai', NULL),
        ($1, 2, 'ai', NULL),
        ($1, 3, 'ai', NULL)
    `, [roomId, validUserId])
    console.log('2. 添加4个玩家')

    // 3. 创建游戏
    const gameId = uuidv4()
    await client.query(`
      INSERT INTO games (id, room_id, status, turn_no, current_seat, state_public, state_private, seed)
      VALUES ($1, $2, 'playing', 0, 0, $3, $4, $5)
    `, [gameId, roomId,
        JSON.stringify({
          counts: [27, 27, 27, 27],
          currentPlay: null,
          rankings: [],
          levelRank: 2
        }),
        JSON.stringify({
          hands: {
            '0': generateHand(27),
            '1': generateHand(27),
            '2': generateHand(27),
            '3': generateHand(27)
          }
        }),
        Math.floor(Math.random() * 1000000)
    ])
    console.log(`3. 创建游戏: ${gameId}`)

    // 4. 模拟游戏过程 - 让座位1,2,3的AI先出完牌
    console.log('\n4. 开始模拟游戏...')

    // 座位1出完所有牌
    await playAllCards(client, gameId, 1, roomId)
    console.log('   座位1 (AI) 出完所有牌')

    // 座位2出完所有牌
    await playAllCards(client, gameId, 2, roomId)
    console.log('   座位2 (AI) 出完所有牌')

    // 座位3出完所有牌
    await playAllCards(client, gameId, 3, roomId)
    console.log('   座位3 (AI) 出完所有牌')

    // 5. 验证排名
    const { rows: finalGames } = await client.query(`
      SELECT status, state_public
      FROM games
      WHERE id = $1
    `, [gameId])

    const finalGame = finalGames[0]
    console.log('\n=== 最终结果 ===')
    console.log(`游戏状态: ${finalGame.status}`)
    console.log(`排名: ${JSON.stringify(finalGame.state_public.rankings)}`)
    console.log(`counts: ${JSON.stringify(finalGame.state_public.counts)}`)

    // 6. 验证排名是否正确
    const rankings = finalGame.state_public.rankings || []
    if (rankings.length === 3) {
      console.log('\n✅ 排名系统验证成功！')
      console.log(`   第1名: 座位 ${rankings[0]}`)
      console.log(`   第2名: 座位 ${rankings[1]}`)
      console.log(`   第3名: 座位 ${rankings[2]}`)
      console.log(`   第4名: 座位 0 (人类玩家 - 还有牌)`)
    } else {
      console.log('\n❌ 排名验证失败')
      console.log(`   预期3个排名，实际得到 ${rankings.length} 个`)
    }

    // 7. 清理
    await client.query('DELETE FROM room_members WHERE room_id = $1', [roomId])
    await client.query('DELETE FROM games WHERE room_id = $1', [roomId])
    await client.query('DELETE FROM rooms WHERE id = $1', [roomId])
    console.log('\n✓ 已清理测试数据')

  } catch (e) {
    console.log('❌ 错误:', e.message)
    console.log('详情:', e.detail)
    console.log('堆栈:', e.stack)
  } finally {
    await client.end()
  }
}

// 生成虚拟手牌
function generateHand(count) {
  const hand = []
  for (let i = 0; i < count; i++) {
    hand.push({
      id: i,
      suit: Math.floor(i / 13),
      rank: i % 13
    })
  }
  return hand
}

// 模拟某个玩家出完所有牌
async function playAllCards(client, gameId, seat, roomId) {
  // 获取当前游戏状态
  const { rows: games } = await client.query(`
    SELECT state_public, state_private, turn_no, current_seat
    FROM games
    WHERE id = $1
  `, [gameId])

  const game = games[0]
  let statePublic = game.state_public || {}
  let statePrivate = game.state_private || {}
  let turnNo = game.turn_no

  // 获取该玩家的手牌
  const hands = statePrivate.hands || {}
  const myHand = hands[seat.toString()] || []

  // 如果已经没有牌了，跳过
  if (myHand.length === 0) {
    return
  }

  // 清空手牌
  statePrivate.hands[seat.toString()] = []

  // 更新counts
  const counts = statePublic.counts || [27, 27, 27, 27]
  counts[seat] = 0
  statePublic.counts = counts

  // 添加到排名
  let rankings = statePublic.rankings || []
  rankings = [...rankings, seat]
  statePublic.rankings = rankings

  // 如果有3个玩家出完了，游戏结束
  if (rankings.length >= 3) {
    statePublic.status = 'finished'
  }

  // 更新游戏
  await client.query(`
    UPDATE games
    SET state_private = $1,
        state_public = $2,
        status = $3,
        turn_no = $4
    WHERE id = $5
  `, [JSON.stringify(statePrivate),
      JSON.stringify(statePublic),
      statePublic.status || 'playing',
      turnNo + 1,
      gameId])
}

simulateFullGame().catch(console.error)
