#!/usr/bin/env node

/**
 * 上下文状态栏测试脚本
 *
 * 这个脚本用于快速测试状态栏组件的各种配置
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoPages = [
  {
    name: '基础版演示',
    path: '/context-demo',
    description: '展示基础版状态栏功能',
  },
  {
    name: '增强版演示',
    path: '/context-demo-pro',
    description: '展示增强版状态栏功能',
  },
  {
    name: '专业版演示',
    path: '/context-demo-pro?theme=neon',
    description: '展示专业版霓虹主题',
  },
];

console.log('🚀 上下文状态栏测试工具\n');

console.log('选择要运行的演示:\n');

demoPages.forEach((page, index) => {
  console.log(`${index + 1}. ${page.name}`);
  console.log(`   ${page.description}`);
  console.log(`   ${page.path}\n`);
});

console.log('4. 运行所有演示\n');
console.log('5. 停止所有进程\n');
console.log('0. 退出\n');

const choice = prompt('请选择 (0-5): ');

async function startDemo(index) {
  if (index < 1 || index > demoPages.length) {
    console.log('❌ 无效选择\n');
    return;
  }

  const page = demoPages[index - 1];
  console.log(`\n🚀 启动 ${page.name}...`);

  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  return new Promise((resolve) => {
    devProcess.on('close', (code) => {
      console.log(`\n✅ ${page.name} 已停止 (退出码: ${code})`);
      resolve();
    });

    devProcess.on('error', (err) => {
      console.error(`\n❌ 启动失败: ${err.message}`);
      resolve();
    });
  });
}

async function runAllDemos() {
  console.log('\n🔄 启动所有演示...\n');

  for (let i = 0; i < demoPages.length; i++) {
    await startDemo(i + 1);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log('\n✅ 所有演示已停止\n');
}

async function stopAllDemos() {
  console.log('\n🛑 停止所有演示...\n');

  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  devProcess.on('close', (code) => {
    console.log(`\n✅ 所有演示已停止 (退出码: ${code})\n`);
  });
}

async function main() {
  switch (choice) {
    case '1':
    case '2':
    case '3':
      await startDemo(parseInt(choice));
      break;
    case '4':
      await runAllDemos();
      break;
    case '5':
      await stopAllDemos();
      break;
    case '0':
      console.log('👋 退出\n');
      process.exit(0);
    default:
      console.log('❌ 无效选择\n');
      process.exit(1);
  }
}

main();
