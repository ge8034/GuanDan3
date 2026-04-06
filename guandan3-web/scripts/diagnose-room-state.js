// 诊断房间状态
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function diagnose() {
  console.log('=== 诊断房间状态 ===');
  
  // 检查房间
  const roomsRes = await fetch(`${supabaseUrl}/rest/v1/rooms?room_type=eq.practice&limit=5`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const rooms = await roomsRes.json();
  console.log('练习房间:', rooms.length, '个');
  rooms.forEach(r => console.log('  -', r.id, r.name, r.status));
  
  // 检查游戏
  const gamesRes = await fetch(`${supabaseUrl}/rest/v1/games?select=*&order=created_at.desc&limit=5`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const games = await gamesRes.json();
  console.log('最近游戏:', games.length, '个');
  games.forEach(g => console.log('  -', g.id, 'room:', g.room_id, 'status:', g.status, 'turn:', g.current_turn));
  
  // 检查手牌
  const handsRes = await fetch(`${supabaseUrl}/rest/v1/game_hands?select=*&limit=5`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
  });
  const hands = await handsRes.json();
  console.log('手牌记录:', hands.length, '个');
  hands.forEach(h => console.log('  - game:', h.game_id, 'seat:', h.seat_no, 'cards:', h.hand ? h.hand.length : 'null'));
}

diagnose();
