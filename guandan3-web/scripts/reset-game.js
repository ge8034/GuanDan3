const { Client } = require('pg')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

async function resetGame() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('✓ 已连接数据库')

    // 获取所有进行中的游戏
    const { rows: games } = await client.query(`
      SELECT id, room_id, status, state_public
      FROM games
      WHERE status IN ('playing', 'deal', 'paused')
      ORDER BY created_at DESC
    `)

    console.log(`\n找到 ${games.length} 个进行中的游戏`)

    for (const game of games) {
      console.log(`\n游戏 ID: ${game.id}`)
      console.log(`  状态: ${game.status}`)
      console.log(`  房间 ID: ${game.room_id}`)

      // 将游戏状态设为 finished，以便创建新游戏
      await client.query(`
        UPDATE games
        SET status = 'finished'
        WHERE id = $1
      `, [game.id])

      console.log(`  ✓ 已标记为 finished`)
    }

    // 同时标记相关房间为已完成
    for (const game of games) {
      await client.query(`
        UPDATE rooms
        SET status = 'finished'
        WHERE id = $1
      `, [game.room_id])
      console.log(`  ✓ 房间 ${game.room_id} 已标记为 finished`)
    }

    console.log('\n✅ 重置完成，现在可以创建新游戏')

  } catch (e) {
    console.log('❌ 错误:', e.message)
    console.log('详情:', e.detail)
  } finally {
    await client.end()
  }
}

resetGame().catch(console.error)
