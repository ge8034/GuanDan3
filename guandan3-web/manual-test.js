// manual-test.js - 在浏览器控制台运行以验证修复
// 在房间页面(http://localhost:3000/room/xxxx)打开控制台，粘贴并运行此代码

async function testFix() {
  console.log('🧪 开始手动验证修复...');

  try {
    // 1. 获取当前房间ID
    const roomId = window.location.pathname.split('/').pop();
    console.log('房间ID:', roomId);

    // 2. 获取Supabase客户端配置
    const sbUrl = 'https://rzzywltxlfgucngfiznx.supabase.co';
    const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM';

    // 3. 创建Supabase客户端（如果不存在）
    if (typeof window.supabase === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      document.head.appendChild(script);

      await new Promise(resolve => {
        script.onload = resolve;
      });

      window.supabase = window.supabase.createClient(sbUrl, sbKey);
    }

    // 4. 测试setup_test_endgame函数
    console.log('🔧 执行终局设置...');
    const { error } = await window.supabase.rpc('setup_test_endgame', {
      p_room_id: roomId
    });

    if (error) {
      console.error('❌ 终局设置失败:', error.message);
      return false;
    }

    console.log('✅ 终局设置成功');

    // 5. 验证修复效果
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 检查页面状态
    const pageContent = document.body.innerText;
    const hasCards = pageContent.includes('1 Cards');
    const hasPlayButton = document.querySelector('button:has-text("Play")') !== null;

    console.log('📊 页面状态:');
    console.log('- 显示1张牌:', hasCards ? '✅' : '❌');
    console.log('- 有Play按钮:', hasPlayButton ? '✅' : '❌');

    if (hasCards && hasPlayButton) {
      console.log('\n🎯 修复验证成功！可以开始打牌测试排名功能');
      console.log('\n📝 下一步手动测试:');
      console.log('1. 点击手牌选中');
      console.log('2. 点击Play按钮');
      console.log('3. 观察是否出现皇冠👑或排名徽章');
      console.log('4. 检查手牌数是否变为0');
      return true;
    } else {
      console.log('❌ 页面状态可能不正确，需要刷新页面');
      return false;
    }

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
    return false;
  }
}

// 运行测试
testFix().then(success => {
  console.log(success ? '\n🎉 修复生效！' : '\n⚠️  需要检查修复状态');
});