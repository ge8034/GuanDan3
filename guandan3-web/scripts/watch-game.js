/**
 * 监控游戏进度，观察排名产生过程
 */

const { Client } = require('pg')
const fs = require('fs')

const envPath = '.env.local'
const envContent = fs.readFileSync(envPath, 'utf8')
const DATABASE_URL = envContent.split('\n').find(line => line.startsWith('DATABASE_URL='))?.split('=')[1]

async function watchGame() {
  const client = new Client({ connectionString: DATABASE_URL })

  try {
    await client.connect()
    console.log('✓ 已连接数据库')
    console.log('开始监控游戏...\n')

    let gameId = null
    let lastCounts = null
    let lastRankings = []
    let lastStatus = ''

    // 获取最新的游戏
    const { rows: games } = await client.query(`
      SELECT id, status, state_public
      FROM games
      WHERE status = 'playing'
      ORDER BY created_at DESC
      LIMIT 1
    `)

    if (games.length === 0) {
      console.log('没有进行中的游戏')
      return
    }

    gameId = games[0].id
    console.log(`监控游戏: ${gameId}\n`)

    // 每3秒检查一次
    for (let i = 0; i < 100; i++) {
      const { rows: currentGames } = await client.query(`
        SELECT status, state_public
        FROM games
        WHERE id = $1
      `, [gameId])

      if (currentGames.length === 0) {
        console.log('游戏已删除')
        break
      }

      const game = currentGames[0]
      const counts = game.state_public?.counts || []
      const rankings = game.state_public?.rankings || []
      const status = game.status

      // 只在状态变化时打印
      if (JSON.stringify(counts) !== JSON.stringify(lastCounts) ||
          JSON.stringify(rankings) !== JSON.stringify(lastRankings) ||
          status !== lastStatus) {

        console.log(`[${new Date().toLocaleTimeString()}] 状态: ${status}`)
        console.log(`  手牌数: [${counts.join(', ')}]`)
        if (rankings.length > 0) {
          console.log(`  排名: [${rankings.join(', ')}]`)
          const rankLabels = rankings.map((r, i) => `第${i+1}名: 座位${r}`).join(' | ')
          console.log(`  ${rankLabels}`)
        }
        console.log()

        lastCounts = counts
        lastRankings = rankings
        lastStatus = status
      }

      // 如果游戏结束
      if (status === 'finished') {
        console.log('=== 游戏结束 ===')
        console.log(`最终排名: ${rankings.join(', ')}`)
        console.log(`\n排名详情:`)
        rankings.forEach((seat, index) => {
          console.log(`  🏆 第${index + 1}名: 座位 ${seat}`)
        })
        break
      }

      // 等待3秒
      await new Promise(resolve => setTimeout(resolve, 3000))
    }

    console.log('\n监控结束')

  } catch (e) {
    console.log('❌ 错误:', e.message)
    console.log('详情:', e.detail)
  } finally {
    await client.end()
  }
}

watchGame().catch(console.error)
