// 简单测试AI系统
import { TaskPlanner } from './src/lib/multi-agent/system/TaskPlanner.js'
import { TaskDispatcher } from './src/lib/multi-agent/system/TaskDispatcher.js'
import { TeamManager } from './src/lib/multi-agent/system/TeamManager.js'
import { MessageBus } from './src/lib/multi-agent/core/MessageBus.js'

console.log('=== 开始测试AI系统 ===\n')

// 1. 创建team manager和dispatcher
console.log('1. 创建TeamManager...')
const teamManager = new TeamManager()
const dispatcher = new TaskDispatcher(teamManager)

// 2. 创建agents
console.log('2. 创建agents...')
const agents = []
for (let i = 0; i < 4; i++) {
  agents.push({
    id: `test-agent-${i}`,
    role: 'GuanDanAI',
    capabilities: [{ type: 'DecideMove', level: 10 }],
    maxLoad: 1,
    difficulty: 'medium'
  })
}

console.log('创建的agents:', agents.map(a => a.id))

// 3. 创建team
console.log('3. 创建team...')
try {
  teamManager.createTeam('test-room', agents)
  console.log('Team创建成功')
} catch (e) {
  console.error('Team创建失败:', e)
}

// 4. 创建task
console.log('4. 创建Task...')
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
}

console.log('Task创建:', task.id, task.type)

// 5. 分解任务
console.log('\n5. 调用planner.decompose()...')
const planner = new TaskPlanner()
const subtasks = planner.decompose(task)

console.log('子任务数量:', subtasks.length)
subtasks.forEach((t, i) => {
  console.log(`  ${i+1}. ${t.id} (${t.type})`)
})

// 6. 提交任务
console.log('\n6. 调用dispatcher.submitTasks()...')
await dispatcher.submitTasks(subtasks)

console.log('\n=== 测试完成 ===')
