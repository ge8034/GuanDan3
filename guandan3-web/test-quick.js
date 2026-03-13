// test-quick.js - 快速验证修复是否有效
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function quickTest() {
  try {
    // 读取环境变量
    const envPath = path.resolve(__dirname, '.env.local');
    let sbUrl, sbKey;
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      sbUrl = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
      sbKey = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    }

    const supabase = createClient(sbUrl, sbKey);

    // 创建测试游戏
    console.log('创建测试游戏...');
    const { data: room } = await supabase
      .from('rooms')
      .insert([{ name: `QuickTest-${Date.now()}`, mode: 'pvp4' }])
      .select()
      .single();

    const { data: game } = await supabase
      .from('games')
      .insert([{
        room_id: room.id,
        status: 'playing',
        turn_no: 0,
        current_seat: 0
      }])
      .select()
      .single();

    console.log(`测试游戏ID: ${game.id}`);

    // 执行setup_test_endgame
    console.log('执行终局设置...');
    const { error } = await supabase.rpc('setup_test_endgame', {
      p_room_id: room.id
    });

    if (error) {
      console.error('❌ 终局设置失败:', error.message);
      return false;
    }

    // 验证状态
    const { data: updatedGame } = await supabase
      .from('games')
      .select('*')
      .eq('id', game.id)
      .single();

    console.log('验证结果:');
    console.log('- 轮次号:', updatedGame.turn_no, '(应该是 1)');
    console.log('- 当前座位:', updatedGame.current_seat, '(应该是 0)');
    console.log('- 计数:', updatedGame.state_public.counts, '(应该是 [1,1,1,1])');

    const success = updatedGame.turn_no === 1 &&
                   updatedGame.current_seat === 0 &&
                   JSON.stringify(updatedGame.state_public.counts) === '[1,1,1,1]';

    if (success) {
      console.log('✅ 修复验证成功！');
    } else {
      console.log('❌ 修复可能未生效');
    }

    return success;

  } catch (error) {
    console.error('验证失败:', error.message);
    return false;
  }
}

quickTest().then(success => {
  console.log('\n' + (success ? '🎉 准备好运行测试！' : '⚠️ 需要检查SQL执行'));
  process.exit(success ? 0 : 1);
});