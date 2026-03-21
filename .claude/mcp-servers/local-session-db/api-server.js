#!/usr/bin/env node

/**
 * 本地会话数据库 HTTP API 服务器
 * 提供 REST API 接口用于访问会话数据
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 创建 Express 应用
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// API 路由
app.get('/api/sessions', async (req, res) => {
  try {
    const sessionIds = await listSessionIds();
    res.json({
      success: true,
      data: sessionIds,
      count: sessionIds.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
  try {
    const session = await loadSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: '会话不存在',
      });
    }
    res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { sessionId, data } = req.body;
    if (!sessionId || !data) {
      return res.status(400).json({
        success: false,
        error: '缺少必需参数: sessionId 或 data',
      });
    }
    await saveSession(sessionId, data);
    res.json({
      success: true,
      message: '会话已保存',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete('/api/sessions/:sessionId', async (req, res) => {
  try {
    const deleted = await deleteSession(req.params.sessionId);
    res.json({
      success: true,
      message: deleted ? '会话已删除' : '会话不存在',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '本地会话数据库服务运行正常',
    timestamp: new Date().toISOString(),
  });
});

// 启动服务器
const PORT = process.env.SESSION_DB_PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 本地会话数据库 API 服务器运行在端口 ${PORT}`);
  console.log(`📖 API 文档: http://localhost:${PORT}/api`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  process.exit(0);
});
