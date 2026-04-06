const { Client } = require('pg')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

async function diagnoseErrorPosition() {
  const client = new Client({ connectionString: DATABASE_URL })
  try {
    await client.connect()

    // 创建测试游戏
    console.log('创建测试游戏...')
    const testRoomId = '00000000-0000-0000-0000-000000000099'
    const testGameId = '00000000-0000-0000-0000-000000000099'

    // 清理旧数据
    await client.query('DELETE FROM turns WHERE game_id = $1', [testGameId])
    await client.query('DELETE FROM games WHERE id = $1', [testGameId])
    await client.query('DELETE FROM room_members WHERE room_id = $1', [testRoomId])
    await client.query('DELETE FROM rooms WHERE id = $1', [testRoomId])

    // 创建房间
    await client.query('INSERT INTO rooms (id, name, mode, visibility, owner_uid) VALUES ($1, $2, $3, $4, $5)',
      [testRoomId, 'Test Room', 'pve1v3', 'private', '00000000-0000-0000-0000-000000000001'])

    // 添加成员
    await client.query('INSERT INTO room_members (room_id, member_type, uid, ai_key, seat_no, ready) VALUES ($1, $2, $3, $4, $5, $6)',
      [testRoomId, 'human', '00000000-0000-0000-0000-000000000001', null, 0, true])
    await client.query('INSERT INTO room_members (room_id, member_type, uid, ai_key, seat_no, ready) VALUES ($1, $2, $3, $4, $5, $6)',
      [testRoomId, 'ai', null, 'bot_1', 1, true])
    await client.query('INSERT INTO room_members (room_id, member_type, uid, ai_key, seat_no, ready) VALUES ($1, $2, $3, $4, $5, $6)',
      [testRoomId, 'ai', null, 'bot_2', 2, true])
    await client.query('INSERT INTO room_members (room_id, member_type, uid, ai_key, seat_no, ready) VALUES ($1, $2, $3, $4, $5, $6)',
      [testRoomId, 'ai', null, 'bot_3', 3, true])

    // 创建游戏（已开始状态）
    const hands = {
      '0': [{id: 1, suit: 'h', rank: 1}, {id: 2, suit: 'h', rank: 2}, {id: 3, suit: 'h', rank: 3}],
      '1': [{id: 4, suit: 'd', rank: 4}, {id: 5, suit: 'd', rank: 5}, {id: 6, suit: 'd', rank: 6}],
      '2': [{id: 7, suit: 'c', rank: 7}, {id: 8, suit: 'c', rank: 8}, {id: 9, suit: 'c', rank: 9}],
      '3': [{id: 10, suit: 's', rank: 10}, {id: 11, suit: 's', rank: 11}, {id: 12, suit: 's', rank: 12}]
    }

    await client.query('INSERT INTO games (id, room_id, status, turn_no, current_seat, state_private, state_public) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [testGameId, testRoomId, 'playing', 0, 0,
       JSON.stringify({ hands, status: 'playing' }),
       JSON.stringify({ counts: [3, 3, 3, 3], rankings: [] })])

    console.log('测试游戏已创建')

    // 测试 play 操作（触发 counts 更新）
    console.log('\n测试 submit_turn (play)...')

    try {
      const sql = `SELECT * FROM public.submit_turn(
        '${testGameId}'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        0,
        '{"type":"play","cards":[{"id":1}]}'::jsonb
      )`

      console.log('SQL:', sql)
      const result = await client.query(sql)
      console.log('✅ submit_turn 成功')
      console.log('返回结果:', result.rows)
    } catch (e) {
      console.log('\n❌ submit_turn 失败:')
      console.log('  错误代码:', e.code)
      console.log('  错误消息:', e.message)
      console.log('  错误位置:', e.position)
      console.log('  错误详情:', e.detail)

      if (e.position) {
        console.log(`\n错误在位置 ${e.position}，让我分析函数代码...`)

        // 获取函数源代码并定位错误位置
        const funcResult = await client.query(`
          SELECT pg_get_functiondef(oid) as def
          FROM pg_proc
          WHERE proname = 'submit_turn'
          AND pronamespace = 'public'::regnamespace
        `)

        const funcDef = funcResult.rows[0].def
        const lines = funcDef.split('\n')

        // 查找错误位置附近的代码
        let pos = 0
        for (let i = 0; i < lines.length; i++) {
          const lineStart = pos + 1
          const lineEnd = pos + lines[i].length + 1
          if (lineStart <= e.position && e.position <= lineEnd) {
            console.log(`\n错误可能在行 ${i + 1}:`)
            console.log(lines[i])
            if (i > 0) console.log('  上一行:', lines[i - 1].trim())
            if (i < lines.length - 1) console.log('  下一行:', lines[i + 1].trim())
            break
          }
          pos = lineEnd
        }
      }
    }

    // 清理测试数据
    await client.query('DELETE FROM turns WHERE game_id = $1', [testGameId])
    await client.query('DELETE FROM games WHERE id = $1', [testGameId])
    await client.query('DELETE FROM room_members WHERE room_id = $1', [testRoomId])
    await client.query('DELETE FROM rooms WHERE id = $1', [testRoomId])
    console.log('\n测试数据已清理')

  } catch (e) {
    console.log('错误:', e.message)
  } finally {
    await client.end()
  }
}

diagnoseErrorPosition().catch(console.error)
