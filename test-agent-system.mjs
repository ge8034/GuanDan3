// 简单测试Agent系统
import { TeamManager } from './guandan3-web/src/lib/multi-agent/system/TeamManager.js';
import { TaskDispatcher } from './guandan3-web/src/lib/multi-agent/system/TaskDispatcher.js';
import { TaskPlanner } from './guandan3-web/src/lib/multi-agent/system/TaskPlanner.js';
import { GuanDanAgent } from './guandan3-web/src/lib/multi-agent/implementations/GuanDanAgent.js';
import { MessageBus } from './guandan3-web/src/lib/multi-agent/core/MessageBus.js';

console.log('=== 开始测试Agent系统 ===\n');

// 1. 创建MessageBus实例
console.log('1. 创建MessageBus实例...');
const messageBus = MessageBus.getInstance();
console.log('[MessageBus] MessageBus实例创建成功\n');

// 2. 创建agents
console.log('2. 创建agents...');
const agents = [];
for (let i = 0; i < 4; i++) {
  agents.push({
    id: `test-agent-${i}`,
    role: 'GuanDanAI',
    capabilities: [{ type: 'DecideMove', level: 10 }],
    maxLoad: 1,
    difficulty: 'medium'
  });
}

console.log('创建的agents:', agents.map(a => a.id));

// 3. 创建team
console.log('3. 创建team...');
const teamManager = new TeamManager();
const dispatcher = new TaskDispatcher(teamManager);
const planner = new TaskPlanner();
teamManager.createTeam('test-room', agents);
console.log('Team创建成功\n');

// 4. 创建task
console.log('4. 创建Task...');
const task = {
  id: 'test-turn-1',
  type: 'GuanDanTurn',
  priority: 10,
  payload: {
    hand: Array.from({ length: 27 }, (_, i) => `CARD_${i}`),
    lastAction: null,
    levelRank: 2,
    seatNo: 1,
    playersCardCounts: [27, 27, 27, 27]
  },
  dependencies: [],
  status: 'PENDING',
  createdAt: Date.now()
};

console.log('Task创建:', task.id, task.type);

// 5. 分解任务
console.log('\n5. 调用planner.decompose()...');
const subtasks = planner.decompose(task);
console.log('子任务数量:', subtasks.length);
subtasks.forEach((t, i) => {
  console.log(`  ${i+1}. ${t.id} (${t.type})`);
});

// 6. 提交任务
console.log('\n6. 调用dispatcher.submitTasks()...');
await dispatcher.submitTasks(subtasks);
console.log('任务已提交\n');

// 7. 等待结果（最多30秒）
console.log('7. 等待任务结果...');
const decisionTask = subtasks.find((t) => t.type === 'DecideMove');
if (decisionTask) {
  try {
    const result = await dispatcher.waitForTaskResult(decisionTask.id, 30000);
    if (result && result.status === 'COMPLETED') {
      console.log('✅ 任务完成！');
      console.log('决策:', result.output.move);
    } else {
      console.log('❌ 任务失败:', result);
    }
  } catch (error) {
    console.error('❌ 任务超时:', error.message);
  }
} else {
  console.error('❌ 未找到决策任务');
}

console.log('\n=== 测试完成 ===');
