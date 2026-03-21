#!/usr/bin/env node

/**
 * 测试 list_sessions 工具
 * 演示如何列出所有会话
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

const serverPath = path.join('D:/Claude-Skills/.claude/mcp-servers/local-session-db/index.js');

console.log('🚀 测试 list_sessions 工具\n');

// 创建 MCP 客户端
const transport = new StdioClientTransport({
  command: 'node',
  args: [serverPath]
});

const client = new Client({
  name: 'test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

async function testListSessions() {
  try {
    // 连接到服务器
    await client.connect(transport);
    console.log('✅ 已连接到 MCP 服务器\n');

    // 首先创建一些测试会话
    console.log('📝 创建测试会话...\n');

    const testSessions = [
      { sessionId: 'test-001', data: { message: 'Session 1', timestamp: new Date().toISOString() } },
      { sessionId: 'test-002', data: { message: 'Session 2', timestamp: new Date().toISOString() } },
      { sessionId: 'test-003', data: { message: 'Session 3', timestamp: new Date().toISOString() } }
    ];

    for (const session of testSessions) {
      await client.callTool({
        name: 'save_session',
        arguments: session
      });
      console.log(`   ✅ 已创建会话: ${session.sessionId}`);
    }

    console.log('\n📋 调用 list_sessions 工具...\n');

    // 调用 list_sessions
    const result = await client.callTool({
      name: 'list_sessions',
      arguments: {}
    });

    console.log('📊 结果:\n');
    console.log(JSON.stringify(result, null, 2));

    // 清理测试会话
    console.log('\n🗑️  清理测试会话...\n');
    for (const session of testSessions) {
      await client.callTool({
        name: 'delete_session',
        arguments: { sessionId: session.sessionId }
      });
      console.log(`   ✅ 已删除会话: ${session.sessionId}`);
    }

    console.log('\n✅ 测试完成！');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error.stack);
  } finally {
    try {
      await client.close();
    } catch (error) {
      // 忽略关闭错误
    }
  }
}

testListSessions();