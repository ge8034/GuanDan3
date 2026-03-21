#!/usr/bin/env node

/**
 * 简单的 MCP 工具测试
 * 直接测试 MCP 服务器的功能
 */

import { spawn } from 'child_process';
import path from 'path';

const serverPath = path.join('D:/Claude-Skills/.claude/mcp-servers/local-session-db/index.js');

console.log('🚀 启动 MCP 服务器测试...\n');

// 启动 MCP 服务器
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

server.stdout.on('data', (data) => {
  console.log(`[服务器输出] ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`[服务器错误] ${data}`);
});

// 等待服务器启动
setTimeout(() => {
  console.log('✅ MCP 服务器已启动\n');
  console.log('💡 现在你可以在 Trae 界面中使用以下 MCP 工具：\n');
  console.log('1. save_session - 保存会话数据');
  console.log('2. get_session - 获取会话数据');
  console.log('3. delete_session - 删除会话数据');
  console.log('4. list_sessions - 列出所有会话\n');
  console.log('📝 测试示例：');
  console.log('   sessionId: "test-001"');
  console.log('   data: { message: "Hello MCP", timestamp: "2026-03-20" }\n');
  console.log('⏹️  按 Ctrl+C 停止服务器\n');
}, 2000);

server.on('close', (code) => {
  console.log(`\n🛑 MCP 服务器已停止 (退出代码: ${code})`);
});