#!/usr/bin/env node

/**
 * MCP 工具测试脚本
 * 测试本地会话数据库 MCP 服务器的所有工具
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(testName, testFn) {
  try {
    log(`\n🔍 测试: ${testName}`, 'cyan');
    await testFn();
    testResults.passed++;
    testResults.tests.push({ name: testName, status: 'passed' });
    log(`✅ ${testName} 通过`, 'green');
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({ name: testName, status: 'failed', error: error.message });
    log(`❌ ${testName} 失败: ${error.message}`, 'red');
  }
}

async function testMCPServer() {
  log('🚀 开始 MCP 服务器测试', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  // 启动 MCP 服务器
  const serverPath = path.join('D:/Claude-Skills/.claude/mcp-servers/local-session-db/index.js');
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // 等待服务器启动
  await new Promise(resolve => setTimeout(resolve, 2000));

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

  try {
    // 连接到服务器
    await client.connect(transport);
    log('✅ 已连接到 MCP 服务器', 'green');

    // 测试 1: 列出可用工具
    await runTest('列出可用工具', async () => {
      const tools = await client.listTools();
      log(`   找到 ${tools.tools.length} 个工具:`, 'gray');
      tools.tools.forEach(tool => {
        log(`   - ${tool.name}: ${tool.description}`, 'gray');
      });

      if (tools.tools.length !== 4) {
        throw new Error(`期望 4 个工具，实际找到 ${tools.tools.length} 个`);
      }
    });

    // 测试 2: 保存会话
    await runTest('保存会话数据', async () => {
      const result = await client.callTool({
        name: 'save_session',
        arguments: {
          sessionId: 'test-session-001',
          data: {
            message: 'Hello MCP',
            timestamp: new Date().toISOString(),
            test: true
          }
        }
      });

      log(`   结果: ${JSON.stringify(result)}`, 'gray');
    });

    // 测试 3: 获取会话
    await runTest('获取会话数据', async () => {
      const result = await client.callTool({
        name: 'get_session',
        arguments: {
          sessionId: 'test-session-001'
        }
      });

      log(`   结果: ${JSON.stringify(result)}`, 'gray');

      if (!result.content || result.content.length === 0) {
        throw new Error('未能获取会话数据');
      }
    });

    // 测试 4: 列出所有会话
    await runTest('列出所有会话', async () => {
      const result = await client.callTool({
        name: 'list_sessions',
        arguments: {}
      });

      log(`   结果: ${JSON.stringify(result)}`, 'gray');
    });

    // 测试 5: 删除会话
    await runTest('删除会话数据', async () => {
      const result = await client.callTool({
        name: 'delete_session',
        arguments: {
          sessionId: 'test-session-001'
        }
      });

      log(`   结果: ${JSON.stringify(result)}`, 'gray');
    });

    // 测试 6: 验证删除后的会话不存在
    await runTest('验证删除后的会话不存在', async () => {
      const result = await client.callTool({
        name: 'get_session',
        arguments: {
          sessionId: 'test-session-001'
        }
      });

      log(`   结果: ${JSON.stringify(result)}`, 'gray');

      // 检查是否返回空结果或错误
      if (result.content && result.content.length > 0) {
        const content = result.content[0];
        if (content.text && !content.text.includes('not found') && !content.text.includes('不存在')) {
          throw new Error('会话应该已被删除，但仍能获取到数据');
        }
      }
    });

  } catch (error) {
    log(`\n❌ 测试过程中发生错误: ${error.message}`, 'red');
    log(error.stack, 'gray');
  } finally {
    // 清理
    try {
      await client.close();
    } catch (error) {
      // 忽略关闭错误
    }

    serverProcess.kill();
  }

  // 显示测试总结
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('📊 测试总结', 'cyan');
  log(`   通过: ${testResults.passed}`, 'green');
  log(`   失败: ${testResults.failed}`, 'red');
  log(`   总计: ${testResults.passed + testResults.failed}`, 'white');

  if (testResults.failed === 0) {
    log('\n✅ 所有测试通过！MCP 服务器工作正常。', 'green');
  } else {
    log('\n❌ 部分测试失败，请检查错误信息。', 'red');
  }

  log('═══════════════════════════════════════════════════════════', 'cyan');

  process.exit(testResults.failed === 0 ? 0 : 1);
}

// 运行测试
testMCPServer().catch(error => {
  log(`\n❌ 测试脚本执行失败: ${error.message}`, 'red');
  log(error.stack, 'gray');
  process.exit(1);
});