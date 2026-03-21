#!/usr/bin/env node

/**
 * list_sessions 工具演示
 * 模拟 MCP list_sessions 工具的功能
 */

import fs from 'fs';
import path from 'path';

const sessionsDir = path.join('d:/Learn-Claude/GuanDan3/sessions-demo');

console.log('🚀 list_sessions 工具演示\n');
console.log('═══════════════════════════════════════════════════════════\n');

// 检查会话目录是否存在
if (!fs.existsSync(sessionsDir)) {
  console.log('📁 会话目录不存在，正在创建...\n');
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// 创建一些测试会话
console.log('📝 创建测试会话...\n');

const testSessions = [
  {
    sessionId: 'demo-001',
    data: {
      message: 'Hello MCP',
      timestamp: new Date().toISOString(),
      type: 'demo'
    }
  },
  {
    sessionId: 'demo-002',
    data: {
      message: 'Second session',
      timestamp: new Date().toISOString(),
      type: 'demo'
    }
  },
  {
    sessionId: 'demo-003',
    data: {
      message: 'Third session',
      timestamp: new Date().toISOString(),
      type: 'demo'
    }
  }
];

for (const session of testSessions) {
  const filePath = path.join(sessionsDir, `${session.sessionId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session.data, null, 2));
  console.log(`   ✅ 已创建会话: ${session.sessionId}`);
}

console.log('\n📋 调用 list_sessions...\n');

// 列出所有会话
const files = fs.readdirSync(sessionsDir);
const sessionIds = files
  .filter(file => file.endsWith('.json'))
  .map(file => file.replace('.json', ''));

console.log('📊 结果:\n');
console.log(`   总会话数: ${sessionIds.length}\n`);

if (sessionIds.length > 0) {
  console.log('   会话列表:');
  sessionIds.forEach((sessionId, index) => {
    console.log(`   ${index + 1}. ${sessionId}`);
  });

  console.log('\n   详细信息:');
  sessionIds.forEach(sessionId => {
    const filePath = path.join(sessionsDir, `${sessionId}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`\n   📄 ${sessionId}:`);
    console.log(`      消息: ${data.message}`);
    console.log(`      时间: ${data.timestamp}`);
    console.log(`      类型: ${data.type}`);
  });
} else {
  console.log('   暂无会话数据');
}

console.log('\n═══════════════════════════════════════════════════════════\n');

// 清理测试会话
console.log('🗑️  清理测试会话...\n');

for (const session of testSessions) {
  const filePath = path.join(sessionsDir, `${session.sessionId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`   ✅ 已删除会话: ${session.sessionId}`);
  }
}

// 删除空目录
try {
  fs.rmdirSync(sessionsDir);
  console.log('   ✅ 已删除会话目录');
} catch (error) {
  // 忽略错误
}

console.log('\n✅ 演示完成！\n');
console.log('💡 提示: 在 Trae 界面中使用 list_sessions 工具可以获得相同的结果\n');