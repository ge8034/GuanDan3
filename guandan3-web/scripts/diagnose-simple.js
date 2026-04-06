const { Client } = require('pg')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

async function diagnoseSimple() {
  const client = new Client({ connectionString: DATABASE_URL })
  try {
    await client.connect()

    // 查找现有游戏
    const { rows: games } = await client.query(`
      SELECT id, turn_no, current_seat, state_private
      FROM games
      WHERE status = 'playing'
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (games.length === 0) {
      console.log('没有找到进行中的游戏，请先创建一个')
      return
    }

    const game = games[0]
    console.log('测试游戏:', game.id)
    console.log('turn_no:', game.turn_no)

    // 测试 pass 操作（不更新手牌）
    console.log('\n测试 submit_turn (pass)...')

    try {
      const sql = `SELECT * FROM public.submit_turn(
        '${game.id}'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,
        ${game.turn_no},
        '{"type":"pass"}'::jsonb
      )`

      const result = await client.query(sql)
      console.log('✅ submit_turn (pass) 成功')
      console.log('返回结果:', result.rows)
    } catch (e) {
      console.log('❌ submit_turn (pass) 失败:')
      console.log('  错误代码:', e.code)
      console.log('  错误消息:', e.message)
      console.log('  错误位置:', e.position)
    }

  } catch (e) {
    console.log('错误:', e.message)
  } finally {
    await client.end()
  }
}

diagnoseSimple().catch(console.error)
