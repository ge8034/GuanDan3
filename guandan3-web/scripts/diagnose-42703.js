const { Client } = require('pg')
const fs = require('fs')

const envPath = 'D:\\Learn-Claude\\GuanDan3\\guandan3-web\\.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')

const DATABASE_URL = envContent
  .split('\n')
  .find(line => line.startsWith('DATABASE_URL='))
  ?.split('=')[1]

async function diagnoseError() {
  const client = new Client({
    connectionString: DATABASE_URL,
  })

  try {
    await client.connect()
    console.log('✓ 已连接数据库')

    // 查找现有游戏
    const { rows: games } = await client.query(`
      SELECT id, room_id, status, turn_no, current_seat, state_public, state_private
      FROM games
      WHERE status = 'playing'
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (games.length === 0) {
      console.log('没有找到进行中的游戏')
      return
    }

    const game = games[0]
    console.log(`\n游戏 ID: ${game.id}`)
    console.log(`turn_no: ${game.turn_no}`)
    console.log(`current_seat: ${game.current_seat}`)
    console.log(`state_public:`, JSON.stringify(game.state_public))

    // 测试 counts 提取
    console.log('\n--- 测试 counts 提取 ---')

    const statePublic = game.state_public || {}
    const counts = statePublic.counts || [27, 27, 27, 27]

    console.log('counts 值:', counts)
    console.log('counts 类型:', typeof counts)
    console.log('counts 是否为数组:', Array.isArray(counts))

    // 测试 jsonb_array_elements
    try {
      const result1 = await client.query(`
        SELECT jsonb_array_elements($1::jsonb) as elem
      `, [JSON.stringify(counts)])
      console.log('jsonb_array_elements 结果:', result1.rows)
    } catch (e) {
      console.log('jsonb_array_elements 失败:', e.message)
    }

    // 测试完整提取
    try {
      const result2 = await client.query(`
        SELECT (elem->>0)::int as value
        FROM jsonb_array_elements($1::jsonb) as elem
      `, [JSON.stringify(counts)])
      console.log('完整提取结果:', result2.rows)
    } catch (e) {
      console.log('完整提取失败:', e.message)
    }

    // 测试 int[] 转换
    try {
      const result3 = await client.query(`
        SELECT array_agg((elem->>0)::int) as int_array
        FROM jsonb_array_elements($1::jsonb) as elem
      `, [JSON.stringify(counts)])
      console.log('int[] 转换结果:', result3.rows[0])
    } catch (e) {
      console.log('int[] 转换失败:', e.message)
    }

    // 测试 submit_turn 调用（捕获详细错误）
    console.log('\n--- 测试 submit_turn ---')
    try {
      const testActionId = '00000000-0000-0000-0000-000000000002'

      const result = await client.query(`
        SELECT public.submit_turn($1, $2, $3, $4)
      `, [game.id, testActionId, game.turn_no, '{"type":"pass"}'])

      console.log('✓ submit_turn 调用成功')
      console.log('返回结果:', result.rows)
    } catch (e) {
      console.log('❌ submit_turn 调用失败:')
      console.log('错误代码:', e.code)
      console.log('错误消息:', e.message)
      console.log('错误详情:', e.detail)
      console.log('错误提示:', e.hint)
      console.log('错误位置:', e.position)
      console.log('错误栈:', e.stack)

      // 解析错误位置
      if (e.position) {
        console.log(`\n错误位置在字符 ${e.position}`)
      }
    }

  } catch (e) {
    console.log('❌ 错误:', e)
  } finally {
    await client.end()
  }
}

diagnoseError().catch(console.error)
