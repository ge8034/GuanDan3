const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=([^\s\n]+)/);
const DB_URL = dbUrlMatch ? dbUrlMatch[1] : null;

async function cleanPracticeGames() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log('已连接到数据库');

  // 查找练习模式房间
  const rooms = await client.query("SELECT id, mode FROM rooms WHERE mode = 'pve1v3'");
  console.log(`\n找到 ${rooms.rows.length} 个练习模式房间`);

  for (const room of rooms.rows) {
    // 查找该房间进行中的游戏
    const games = await client.query(
      "SELECT id, status, turn_no FROM games WHERE room_id = $1 AND status IN ('playing', 'deal', 'paused')",
      [room.id]
    );

    if (games.rows.length > 0) {
      console.log(`\n房间 ${room.id.slice(0, 8)}... 的进行中游戏:`);

      for (const game of games.rows) {
        console.log(`  - 游戏 ${game.id.slice(0, 8)}... 状态: ${game.status} 轮次: ${game.turn_no}`);

        // 将游戏状态设为finished
        await client.query(
          "UPDATE games SET status = 'finished' WHERE id = $1",
          [game.id]
        );
        console.log(`    ✓ 已标记为finished`);
      }
    }
  }

  // 清理旧的练习房间（超过1小时的）
  const result = await client.query(`
    DELETE FROM rooms
    WHERE mode = 'pve1v3'
    AND created_at < NOW() - INTERVAL '1 hour'
    RETURNING id
  `);
  console.log(`\n清理了 ${result.rows.length} 个旧练习房间`);

  await client.end();
  console.log('\n✅ 清理完成');
}

cleanPracticeGames().catch(err => {
  console.error('错误:', err.message);
  process.exit(1);
});
