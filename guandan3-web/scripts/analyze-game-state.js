const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=([^\s\n]+)/);
const DB_URL = dbUrlMatch ? dbUrlMatch[1] : null;

async function analyze() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // 检查最新的练习房间
  const rooms = await client.query(`
    SELECT id, mode, created_at
    FROM rooms
    WHERE mode = 'pve1v3'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (rooms.rows.length === 0) {
    console.log('没有找到练习房间');
    await client.end();
    return;
  }

  const roomId = rooms.rows[0].id;
  console.log('=== 最新练习房间 ===');
  console.log('房间ID:', roomId);
  console.log('创建时间:', rooms.rows[0].created_at);

  // 检查该房间的游戏
  const games = await client.query(`
    SELECT id, status, turn_no, current_seat, state_private
    FROM games
    WHERE room_id = $1
    ORDER BY created_at DESC
    LIMIT 1
  `, [roomId]);

  if (games.rows.length === 0) {
    console.log('该房间没有游戏');
  } else {
    const game = games.rows[0];
    console.log('\n=== 游戏状态 ===');
    console.log('游戏ID:', game.id);
    console.log('状态:', game.status);
    console.log('轮次:', game.turn_no);
    console.log('当前座位:', game.current_seat);
    console.log('state_private:', game.state_private ? '存在' : 'NULL');

    if (game.state_private) {
      const sp = game.state_private;
      console.log('state_private类型:', typeof sp);
      console.log('state_private是对象:', sp && typeof sp === 'object');
      if (sp) {
        console.log('state_private键:', Object.keys(sp).join(', '));
      }
    }
  }

  // 检查成员
  const members = await client.query(`
    SELECT seat_no, member_type
    FROM room_members
    WHERE room_id = $1
    ORDER BY seat_no
  `, [roomId]);

  console.log('\n=== 房间成员 ===');
  for (const m of members.rows) {
    console.log(`座位 ${m.seat_no}: ${m.member_type}`);
  }

  await client.end();
}

analyze().catch(err => console.error('错误:', err.message));
