import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少环境变量')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAccess() {
  console.log('正在验证 RLS 修复...\n')

  // 1. 测试 games 表访问
  console.log('1. 测试 games 表访问:')
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, state_public, state_private')
    .order('created_at', { ascending: false })
    .limit(1)

  if (gamesError) {
    console.error('   ❌ 失败:', gamesError.message)
  } else {
    console.log('   ✅ 成功!')
    if (games && games.length > 0) {
      const game = games[0]
      console.log('   游戏ID:', game.id)
      console.log('   state_public:', JSON.stringify(game.state_public))
      
      if (game.state_private?.hands) {
        console.log('   state_private.hands 存在:', Object.keys(game.state_private.hands))
      } else {
        console.log('   ⚠️  state_private.hands 不存在，将查询 game_hands 表')
      }
    }
  }

  // 2. 测试 game_hands 表访问
  console.log('\n2. 测试 game_hands 表访问:')
  if (games && games.length > 0) {
    const gameId = games[0].id
    const { data: hands, error: handsError } = await supabase
      .from('game_hands')
      .select('seat_no, hand')
      .eq('game_id', gameId)
      .order('seat_no')

    if (handsError) {
      console.error('   ❌ 失败:', handsError.message)
    } else {
      console.log('   ✅ 成功!')
      console.log(`   找到 ${hands?.length || 0} 个座位的手牌`)
      hands?.forEach(h => {
        console.log(`   座位 ${h.seat_no}: ${Array.isArray(h.hand) ? h.hand.length + ' 张牌' : '非数组'}`)
      })
    }
  }

  console.log('\n验证完成!')
}

verifyAccess()
