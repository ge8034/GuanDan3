const { createClient } = require('@supabase/supabase-js')

const URL = 'https://rzzywltxlfgucngfiznx.supabase.co'
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZ1Y25nZml6bngiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc2OTA1MzU2OSwiZXhwIjoyMDg0NjI5NTY5fQ.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM'

const supabase = createClient(URL, KEY)

async function test() {
  // 先登录
  const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously()
  if (signInError) {
    console.log('登录失败:', signInError.message)
    return
  }
  const userId = signInData.user?.id
  console.log('用户 ID:', userId)

  // 创建练习房
  console.log('\n创建练习房...')
  const { data: roomData, error: roomError } = await supabase.rpc('create_practice_room', {
    p_visibility: 'private',
    p_user_id: userId
  })

  if (roomError) {
    console.log('创建房间失败:', roomError.message)
    return
  }

  const roomId = roomData?.[0]?.room_id
  console.log('房间 ID:', roomId)

  // 等待游戏创建
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 查询游戏
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, status, turn_no, current_seat')
    .eq('room_id', roomId)
    .single()

  if (gamesError || !games) {
    console.log('查询游戏失败:', gamesError?.message)
    return
  }

  console.log('游戏 ID:', games.id)
  console.log('游戏状态:', games.status)
  console.log('turn_no:', games.turn_no)
  console.log('current_seat:', games.current_seat)

  // 如果状态是 'deal'，需要调用 start_game
  if (games.status === 'deal') {
    console.log('\n游戏状态为 deal，调用 start_game...')
    const { data: startData, error: startError } = await supabase.rpc('start_game', {
      p_room_id: roomId
    })

    if (startError) {
      console.log('start_game 失败:', startError.message)
      console.log('  详情:', startError.details)
      return
    }
    console.log('✓ start_game 成功')

    // 重新查询游戏状态
    const { data: updatedGames } = await supabase
      .from('games')
      .select('id, status, turn_no, current_seat')
      .eq('room_id', roomId)
      .single()

    if (updatedGames) {
      console.log('更新后游戏状态:', updatedGames.status)
    }
  }

  // 测试 submit_turn (pass 操作)
  console.log('\n测试 submit_turn (pass)...')
  const { data: turnData, error: turnError } = await supabase.rpc('submit_turn', {
    p_game_id: games.id,
    p_action_id: '00000000-0000-0000-0000-000000000001',
    p_expected_turn_no: 0,
    p_payload: { type: 'pass' }
  })

  if (turnError) {
    console.log('❌ submit_turn (pass) 失败:')
    console.log('  错误代码:', turnError.code)
    console.log('  错误消息:', turnError.message)
    console.log('  错误详情:', turnError.details)
    console.log('  错误提示:', turnError.hint)
  } else {
    console.log('✅ submit_turn (pass) 成功!')
    console.log('  返回结果:', turnData)
  }
}

test().catch(console.error)
