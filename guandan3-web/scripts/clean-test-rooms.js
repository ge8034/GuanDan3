/**
 * 清理测试房间数据
 * 用于E2E测试前清理环境
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少Supabase配置');
  process.exit(1);
}

async function cleanTestRooms() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/clean_test_rooms`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    console.error('清理失败:', await response.text());
    return;
  }

  const result = await response.json();
  console.log('清理结果:', result);
}

cleanTestRooms();
