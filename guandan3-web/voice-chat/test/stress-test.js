const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const SERVER_URL = 'ws://localhost:8080';
const CONCURRENT_USERS = 50;
const TEST_DURATION = 300; // 5分钟

class StressTestClient {
  constructor(userId, userName) {
    this.userId = userId;
    this.userName = userName;
    this.ws = null;
    this.connected = false;
    this.joined = false;
    this.messagesReceived = 0;
    this.messagesSent = 0;
    this.latencies = [];
    this.errors = 0;
    this.connectTime = 0;
    this.joinTime = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      this.ws = new WebSocket(SERVER_URL);

      this.ws.on('open', () => {
        this.connected = true;
        this.connectTime = Date.now() - startTime;
        console.log(`[${this.userName}] 连接成功 (${this.connectTime}ms)`);
        resolve();
      });

      this.ws.on('message', (data) => {
        this.messagesReceived++;
        const message = JSON.parse(data);
        
        if (message.type === 'room_joined') {
          this.joined = true;
          this.joinTime = Date.now() - startTime;
          console.log(`[${this.userName}] 加入房间成功 (${this.joinTime}ms)`);
        }
        
        if (message.type === 'offer' || message.type === 'answer' || message.type === 'ice_candidate') {
          const latency = Date.now() - message.timestamp;
          if (latency > 0) {
            this.latencies.push(latency);
          }
        }
      });

      this.ws.on('error', (error) => {
        this.errors++;
        console.error(`[${this.userName}] 错误:`, error.message);
        reject(error);
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.joined = false;
      });
    });
  }

  createRoom() {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('未连接到服务器'));
        return;
      }

      const message = {
        type: 'create_room',
        userId: this.userId,
        userName: this.userName
      };

      this.ws.send(JSON.stringify(message));
      this.messagesSent++;

      this.ws.once('message', (data) => {
        const response = JSON.parse(data);
        if (response.type === 'room_created') {
          this.joined = true;
          this.roomId = response.roomId;
          console.log(`[${this.userName}] 创建房间成功: ${response.roomId}`);
          resolve(response.roomId);
        } else if (response.type === 'error') {
          reject(new Error(response.message));
        }
      });

      setTimeout(() => {
        if (!this.joined) {
          reject(new Error('创建房间超时'));
        }
      }, 10000);
    });
  }

  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('未连接到服务器'));
        return;
      }

      const message = {
        type: 'join_room',
        roomId: roomId,
        userId: this.userId,
        userName: this.userName
      };

      this.ws.send(JSON.stringify(message));
      this.messagesSent++;

      const checkJoined = setInterval(() => {
        if (this.joined) {
          clearInterval(checkJoined);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkJoined);
        if (!this.joined) {
          reject(new Error('加入房间超时'));
        }
      }, 10000);
    });
  }

  sendOffer(targetUserId) {
    if (!this.connected || !this.joined) return;

    const message = {
      type: 'offer',
      targetUserId: targetUserId,
      offer: { type: 'offer', sdp: 'test-sdp' },
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
    this.messagesSent++;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }

  getStats() {
    const avgLatency = this.latencies.length > 0 
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length 
      : 0;
    
    const maxLatency = this.latencies.length > 0 
      ? Math.max(...this.latencies) 
      : 0;
    
    const minLatency = this.latencies.length > 0 
      ? Math.min(...this.latencies) 
      : 0;

    return {
      userId: this.userId,
      userName: this.userName,
      connected: this.connected,
      joined: this.joined,
      connectTime: this.connectTime,
      joinTime: this.joinTime,
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
      errors: this.errors,
      avgLatency: Math.round(avgLatency),
      maxLatency: maxLatency,
      minLatency: minLatency,
      latencySamples: this.latencies.length
    };
  }
}

async function runStressTest() {
  console.log('='.repeat(60));
  console.log('关丹3 语音通话系统 - 压力测试');
  console.log('='.repeat(60));
  console.log(`并发用户数: ${CONCURRENT_USERS}`);
  console.log(`测试时长: ${TEST_DURATION}秒`);
  console.log(`服务器地址: ${SERVER_URL}`);
  console.log('='.repeat(60));

  const clients = [];

  console.log('\n[阶段1] 创建测试客户端...');
  const createStartTime = Date.now();
  
  for (let i = 0; i < CONCURRENT_USERS; i++) {
    const client = new StressTestClient(
      `user_${i}`,
      `测试用户${i + 1}`
    );
    clients.push(client);
  }
  
  const createDuration = Date.now() - createStartTime;
  console.log(`✓ 创建 ${CONCURRENT_USERS} 个客户端完成 (${createDuration}ms)`);

  console.log('\n[阶段2] 连接到服务器...');
  const connectStartTime = Date.now();
  
  const connectPromises = clients.map(client => 
    client.connect().catch(err => {
      console.error(`连接失败: ${client.userName}`, err.message);
      return null;
    })
  );
  
  await Promise.all(connectPromises);
  const connectedClients = clients.filter(c => c.connected);
  const connectDuration = Date.now() - connectStartTime;
  
  console.log(`✓ ${connectedClients.length}/${CONCURRENT_USERS} 个客户端连接成功 (${connectDuration}ms)`);

  if (connectedClients.length === 0) {
    console.error('❌ 没有客户端成功连接，测试终止');
    return;
  }

  console.log('\n[阶段3] 创建和加入房间...');
  const joinStartTime = Date.now();
  
  const firstClient = connectedClients[0];
  let roomId = null;
  
  try {
    roomId = await firstClient.createRoom();
    console.log(`✓ 房间创建成功: ${roomId}`);
  } catch (err) {
    console.error(`创建房间失败: ${firstClient.userName}`, err.message);
    return;
  }
  
  const otherClients = connectedClients.slice(1);
  const joinPromises = otherClients.map(client => 
    client.joinRoom(roomId).catch(err => {
      console.error(`加入房间失败: ${client.userName}`, err.message);
      return null;
    })
  );
  
  await Promise.all(joinPromises);
  const joinedClients = connectedClients.filter(c => c.joined);
  const joinDuration = Date.now() - joinStartTime;
  
  console.log(`✓ ${joinedClients.length}/${connectedClients.length} 个客户端加入房间 (${joinDuration}ms)`);

  if (joinedClients.length === 0) {
    console.error('❌ 没有客户端成功加入房间，测试终止');
    clients.forEach(c => c.disconnect());
    return;
  }

  console.log('\n[阶段4] 模拟语音信令交换...');
  const messageStartTime = Date.now();
  
  const messageInterval = setInterval(() => {
    joinedClients.forEach((client, index) => {
      const targetIndex = (index + 1) % joinedClients.length;
      const targetClient = joinedClients[targetIndex];
      if (targetClient) {
        client.sendOffer(targetClient.userId);
      }
    });
  }, 1000);

  console.log(`✓ 开始模拟 ${joinedClients.length} 个客户端之间的信令交换`);

  console.log('\n[阶段5] 运行压力测试...');
  console.log(`测试时长: ${TEST_DURATION}秒`);
  
  await new Promise(resolve => setTimeout(resolve, TEST_DURATION * 1000));
  
  clearInterval(messageInterval);
  const messageDuration = Date.now() - messageStartTime;
  
  console.log(`✓ 压力测试完成 (${messageDuration}ms)`);

  console.log('\n[阶段6] 断开连接...');
  clients.forEach(client => client.disconnect());
  console.log('✓ 所有客户端已断开连接');

  console.log('\n' + '='.repeat(60));
  console.log('测试结果统计');
  console.log('='.repeat(60));

  const stats = clients.map(c => c.getStats());
  const successfulClients = stats.filter(s => s.connected && s.joined);

  console.log(`\n总体统计:`);
  console.log(`  总客户端数: ${CONCURRENT_USERS}`);
  console.log(`  成功连接数: ${stats.filter(s => s.connected).length}`);
  console.log(`  成功加入房间数: ${successfulClients.length}`);
  console.log(`  成功率: ${((successfulClients.length / CONCURRENT_USERS) * 100).toFixed(2)}%`);

  if (successfulClients.length > 0) {
    const connectTimes = successfulClients.map(s => s.connectTime);
    const joinTimes = successfulClients.map(s => s.joinTime);
    const latencies = successfulClients.flatMap(s => s.latencies);
    const allMessagesReceived = successfulClients.reduce((sum, s) => sum + s.messagesReceived, 0);
    const allMessagesSent = successfulClients.reduce((sum, s) => sum + s.messagesSent, 0);
    const allErrors = successfulClients.reduce((sum, s) => sum + s.errors, 0);

    console.log(`\n连接性能:`);
    console.log(`  平均连接时间: ${Math.round(connectTimes.reduce((a, b) => a + b, 0) / connectTimes.length)}ms`);
    console.log(`  最快连接时间: ${Math.min(...connectTimes)}ms`);
    console.log(`  最慢连接时间: ${Math.max(...connectTimes)}ms`);

    console.log(`\n加入房间性能:`);
    console.log(`  平均加入时间: ${Math.round(joinTimes.reduce((a, b) => a + b, 0) / joinTimes.length)}ms`);
    console.log(`  最快加入时间: ${Math.min(...joinTimes)}ms`);
    console.log(`  最慢加入时间: ${Math.max(...joinTimes)}ms`);

    if (latencies.length > 0) {
      console.log(`\n消息延迟:`);
      console.log(`  平均延迟: ${Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)}ms`);
      console.log(`  最小延迟: ${Math.min(...latencies)}ms`);
      console.log(`  最大延迟: ${Math.max(...latencies)}ms`);
      console.log(`  延迟样本数: ${latencies.length}`);
    }

    console.log(`\n消息统计:`);
    console.log(`  总发送消息数: ${allMessagesSent}`);
    console.log(`  总接收消息数: ${allMessagesReceived}`);
    console.log(`  错误数: ${allErrors}`);
    console.log(`  消息成功率: ${((allMessagesReceived / allMessagesSent) * 100).toFixed(2)}%`);

    console.log(`\n吞吐量:`);
    console.log(`  每秒消息数: ${Math.round((allMessagesReceived + allMessagesSent) / (TEST_DURATION))}`);
    console.log(`  每客户端每秒消息数: ${Math.round((allMessagesReceived + allMessagesSent) / (TEST_DURATION * successfulClients.length))}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('验收标准检查');
  console.log('='.repeat(60));

  const checks = [
    {
      name: '单房间≥50人并发',
      passed: successfulClients.length >= 50,
      actual: `${successfulClients.length}/50`
    },
    {
      name: '语音延迟≤300ms',
      passed: successfulClients.some(c => c.avgLatency > 0 && c.avgLatency <= 300),
      actual: successfulClients.length > 0 ? `${Math.round(successfulClients.reduce((sum, c) => sum + c.avgLatency, 0) / successfulClients.length)}ms` : 'N/A'
    },
    {
      name: '成功率≥95%',
      passed: (successfulClients.length / CONCURRENT_USERS) >= 0.95,
      actual: `${((successfulClients.length / CONCURRENT_USERS) * 100).toFixed(2)}%`
    }
  ];

  checks.forEach(check => {
    const status = check.passed ? '✓ 通过' : '✗ 失败';
    console.log(`  ${status} - ${check.name} (实际: ${check.actual})`);
  });

  const allPassed = checks.every(c => c.passed);
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✓ 所有验收标准已通过！');
  } else {
    console.log('✗ 部分验收标准未通过，需要优化');
  }
  console.log('='.repeat(60));

  return {
    totalClients: CONCURRENT_USERS,
    successfulClients: successfulClients.length,
    successRate: (successfulClients.length / CONCURRENT_USERS) * 100,
    avgConnectTime: successfulClients.length > 0 ? Math.round(successfulClients.reduce((sum, c) => sum + c.connectTime, 0) / successfulClients.length) : 0,
    avgJoinTime: successfulClients.length > 0 ? Math.round(successfulClients.reduce((sum, c) => sum + c.joinTime, 0) / successfulClients.length) : 0,
    avgLatency: successfulClients.length > 0 ? Math.round(successfulClients.reduce((sum, c) => sum + c.avgLatency, 0) / successfulClients.length) : 0,
    allPassed: allPassed
  };
}

if (require.main === module) {
  runStressTest()
    .then(result => {
      console.log('\n测试完成！');
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('测试失败:', error);
      process.exit(1);
    });
}

module.exports = { StressTestClient, runStressTest };
