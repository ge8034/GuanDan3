#!/usr/bin/env node

/**
 * 本地会话数据库 MCP 服务器
 * 用于高效访问会话数据，避免频繁的 API 调用和速率限制
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 会话数据存储路径
const SESSION_DATA_DIR = path.join(__dirname, 'sessions');

// 确保目录存在
async function ensureDirectories() {
  await fs.mkdir(SESSION_DATA_DIR, { recursive: true });
}

// 加载会话数据
async function loadSession(sessionId) {
  const filePath = path.join(SESSION_DATA_DIR, `${sessionId}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// 保存会话数据
async function saveSession(sessionId, data) {
  const filePath = path.join(SESSION_DATA_DIR, `${sessionId}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 删除会话数据
async function deleteSession(sessionId) {
  const filePath = path.join(SESSION_DATA_DIR, `${sessionId}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

// 获取所有会话 ID
async function listSessionIds() {
  try {
    const files = await fs.readdir(SESSION_DATA_DIR);
    return files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    return [];
  }
}

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'local-session-db',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 工具定义
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_session',
        description: '从本地会话存储中获取会话数据',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: '会话 ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'save_session',
        description: '保存会话数据到本地存储',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: '会话 ID',
            },
            data: {
              type: 'object',
              description: '要保存的会话数据',
            },
          },
          required: ['sessionId', 'data'],
        },
      },
      {
        name: 'delete_session',
        description: '删除会话数据',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: '会话 ID',
            },
          },
          required: ['sessionId'],
        },
      },
      {
        name: 'list_sessions',
        description: '列出所有会话 ID',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    ],
  };
});

// 工具处理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_session': {
        const { sessionId } = args;
        const session = await loadSession(sessionId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(session, null, 2),
            },
          ],
        };
      }

      case 'save_session': {
        const { sessionId, data } = args;
        await saveSession(sessionId, data);
        return {
          content: [
            {
              type: 'text',
              text: `会话 ${sessionId} 已保存`,
            },
          ],
        };
      }

      case 'delete_session': {
        const { sessionId } = args;
        const deleted = await deleteSession(sessionId);
        return {
          content: [
            {
              type: 'text',
              text: deleted
                ? `会话 ${sessionId} 已删除`
                : `会话 ${sessionId} 不存在`,
            },
          ],
        };
      }

      case 'list_sessions': {
        const sessionIds = await listSessionIds();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(sessionIds, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `未知工具: ${name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `错误: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 启动 MCP 服务器（通过 stdio）
async function main() {
  await ensureDirectories();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('本地会话数据库 MCP 服务器已启动');
}

main().catch((error) => {
  console.error('服务器启动失败:', error);
  process.exit(1);
});
