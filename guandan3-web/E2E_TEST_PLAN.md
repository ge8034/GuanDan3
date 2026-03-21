# 端到端测试方案 (E2E Test Plan)

## 1. 概述
本方案旨在为《掼蛋3》Web项目提供一套完整的自动化测试覆盖，确保从用户进入、游戏核心流程到退出的全生命周期质量。鉴于项目为Web应用，本方案基于Playwright实现跨浏览器测试，替代原定针对原生App的Appium方案。

## 2. 测试策略
*   **框架**: Playwright (TypeScript)
*   **运行环境**: 
    *   Local: Windows/Mac/Linux (Chrome/Edge)
    *   CI: GitHub Actions (Ubuntu/Windows)
*   **报告**: Playwright HTML Reporter, List Reporter
*   **数据驱动**: 使用 `.env.local` 和 Mock 数据隔离测试环境

## 3. 核心测试场景 (User Journey)

### 3.1 启动与新手引导 (Launch & Onboarding)
*   **Landing Page**: 验证首页加载速度 (LCP < 3s)，UI元素完整性。
*   **Guest Login**: 验证匿名登录流程，确保无需注册即可进入大厅。
*   **Design System**: 验证基础UI组件（Button, Input, Card）的样式一致性。

### 3.2 大厅功能 (Lobby)
*   **Room List**: 验证房间列表加载、筛选（练习/对战）、排序功能。
*   **Create Room**: 验证创建房间（对战模式/练习模式）流程，校验表单验证。
*   **Join Room**: 验证通过房间ID或列表点击加入房间。

### 3.3 核心玩法 (Gameplay)
*   **Room State**: 验证进房后的座位同步、准备状态同步。
*   **Game Start**: 验证房主开始游戏，发牌动画触发。
*   **Turn Logic**: 验证出牌逻辑（单张、对子、顺子等）、过牌、倒计时。
*   **AI Behavior**: 验证练习模式下AI是否自动托管并出牌。
*   **Game Over**: 验证游戏结算、积分结算、返回大厅流程。

### 3.4 社交与辅助 (Social & Utils)
*   **Chat**: 验证房间内聊天消息发送与接收。
*   **Settings**: 验证音效开关、背景切换等设置项持久化。
*   **History**: 验证战绩记录是否正确生成。

## 4. 自动化脚本设计 (`tests/e2e/lifecycle.spec.ts`)
我们将实现一个串联的测试脚本 `lifecycle.spec.ts`，模拟真实用户完整路径：
1.  打开首页 -> 检查加载性能。
2.  进入大厅 -> 创建练习房间。
3.  游戏内交互 -> 检查手牌、发表情/消息。
4.  退出房间 -> 检查是否返回大厅。
5.  查看战绩 -> 验证记录存在。

## 5. 核心指标定义 (SLAs)
*   **首屏加载 (FCP)**: ≤ 3s (通过 Performance API 验证)
*   **交互响应**: 关键点击操作后 1s 内有 UI 反馈。
*   **稳定性**: 单次测试运行成功率 100%，CI 流水线成功率 ≥ 99.5%。

## 6. CI/CD 集成
*   **Workflow**: `.github/workflows/deploy.yml` 或新建 `e2e.yml`。
*   **Trigger**: Push to main, Pull Request, Daily Schedule.
*   **Artifacts**: 测试失败截图、HTML 报告、视频录制。

## 7. 交付物
*   测试脚本代码 (`tests/e2e/`)
*   测试计划文档 (`E2E_TEST_PLAN.md`)
*   CI 配置文件 (`.github/workflows/`)
