/**
 * 快速验证 last_payload 修复的 Node.js 脚本
 *
 * 使用方法：
 * node scripts/verify-last-payload.js <GAME_ID>
 *
 * 2026-04-01
 */

const { createClient } = require('@supabase/supabase-js');

// 从环境变量读取配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function verifyLastPayload(gameId) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log(`\n🔍 验证游戏 ${gameId} 的 last_payload 逻辑...\n`);

  // 1. 获取游戏基本信息
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('id, turn_no, current_seat, status')
    .eq('id', gameId)
    .single();

  if (gameError) {
    console.error(`❌ 获取游戏失败: ${gameError.message}`);
    return;
  }

  console.log(`📊 游戏状态:`);
  console.log(`   - ID: ${game.id}`);
  console.log(`   - 当前回合: ${game.turn_no}`);
  console.log(`   - 当前座位: ${game.current_seat}`);
  console.log(`   - 状态: ${game.status}`);

  // 2. 获取最近的出牌记录
  const { data: turns, error: turnsError } = await supabase
    .from('turns')
    .select('id, turn_no, seat_no, payload')
    .eq('game_id', gameId)
    .order('turn_no', { ascending: true })
    .limit(10);

  if (turnsError) {
    console.error(`❌ 获取出牌记录失败: ${turnsError.message}`);
    return;
  }

  console.log(`\n📝 最近的出牌记录 (最近10条):`);
  turns.forEach((turn, index) => {
    const type = turn.payload?.type || 'unknown';
    const cardCount = turn.payload?.cards?.length || 0;
    const cardStr = type === 'play' ? `${cardCount}张牌` : '过牌';
    console.log(`   ${turn.turn_no}: Seat ${turn.seat_no} - ${type} ${cardStr}`);
  });

  // 3. 验证 last_payload 获取逻辑
  console.log(`\n🧪 测试 last_payload 获取逻辑:`);

  const testTurnNo = game.turn_no;

  // 模拟迁移修复后的查询
  const lastPlay = turns
    .filter(t => t.turn_no < testTurnNo && t.payload?.type !== 'pass')
    .sort((a, b) => b.turn_no - a.turn_no)[0];

  if (lastPlay) {
    console.log(`   ✅ 找到最后非 pass 出牌:`);
    console.log(`      - turn_no: ${lastPlay.turn_no}`);
    console.log(`      - seat_no: ${lastPlay.seat_no}`);
    console.log(`      - type: ${lastPlay.payload?.type}`);
    console.log(`      - cards: ${JSON.stringify(lastPlay.payload?.cards || [])}`);
  } else {
    console.log(`   ℹ️  未找到非 pass 出牌 (可能是第一轮或所有之前的回合都过牌)`);
  }

  // 4. 测试场景分析
  console.log(`\n📋 场景分析:`);

  // 找出连续过牌的情况
  let passCount = 0;
  let maxPassCount = 0;
  let lastPlayTurnNo = -1;

  for (const turn of turns) {
    if (turn.payload?.type === 'pass') {
      passCount++;
    } else {
      if (passCount > maxPassCount) {
        maxPassCount = passCount;
      }
      passCount = 0;
      lastPlayTurnNo = turn.turn_no;
    }
  }

  if (maxPassCount > 0) {
    console.log(`   🔍 发现连续过牌场景:`);
    console.log(`      - 最多 ${maxPassCount} 个玩家连续过牌`);
    console.log(`      - 最后一次出牌在 turn_no=${lastPlayTurnNo}`);
    console.log(`   ✅ 修复后: 新出牌应与 turn_no=${lastPlayTurnNo} 比较，而不是最近的 pass`);
  } else {
    console.log(`   ℹ️  没有连续过牌场景`);
  }

  // 5. 验证建议
  console.log(`\n💡 建议:`);

  const hasConsecutivePasses = turns.some((turn, i) => {
    if (i === 0) return false;
    return turn.payload?.type === 'pass' && turns[i - 1].payload?.type === 'pass';
  });

  if (hasConsecutivePasses) {
    console.log(`   ✅ 此游戏有连续过牌，适合验证 last_payload 修复`);
    console.log(`   📝 测试步骤:`);
    console.log(`      1. 观察当前回合后的出牌是否正确比较`);
    console.log(`      2. 验证过牌后再次出牌的玩家是否与自己的上一次出牌比较`);
  } else {
    console.log(`   ℹ️  此游戏没有连续过牌，建议测试以下场景:`);
    console.log(`      - 玩家 A 出牌 → 玩家 B, C, D 都过牌 → 玩家 A 再次出牌`);
  }

  console.log(`\n✅ 验证完成\n`);
}

// 从命令行参数获取游戏 ID
const gameId = process.argv[2];

if (!gameId) {
  console.log('用法: node scripts/verify-last-payload.js <GAME_ID>');
  console.log('示例: node scripts/verify-last-payload.js 550e8400-e29b-41d4-a716-446655440000');
  process.exit(1);
}

verifyLastPayload(gameId).catch(console.error);
