#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整游戏流程测试 - 捕获控制台日志并模拟游戏
"""
import sys
import io
from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def test_full_game_flow():
    """测试完整游戏流程并捕获所有日志"""
    issues = []
    console_messages = []
    console_errors = []
    page_errors = []

    print("=" * 60)
    print("启动浏览器...")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 捕获控制台消息
        def on_console(msg):
            msg_type = msg.type
            msg_text = msg.text
            entry = {"type": msg_type, "text": msg_text, "time": datetime.now().isoformat()}
            console_messages.append(entry)
            if msg_type == "error":
                console_errors.append(entry)
                print(f"[CONSOLE ERROR] {msg_text}")
            elif msg_type == "warning":
                print(f"[CONSOLE WARNING] {msg_text}")

        # 捕获页面错误
        def on_page_error(error):
            error_entry = {"message": str(error), "time": datetime.now().isoformat()}
            page_errors.append(error_entry)
            print(f"[PAGE ERROR] {error}")

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        # 1. 访问首页
        print("\n" + "=" * 60)
        print("步骤 1: 访问首页")
        print("=" * 60)
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        print(f"✓ 首页已加载: {page.title()}")
        time.sleep(2)

        # 检查首页元素
        home_practice = page.query_selector('[data-testid="home-practice"]')
        home_lobby = page.query_selector('[data-testid="home-enter-lobby"]')

        if not home_practice:
            issues.append("缺少 '开始练习' 按钮")
        if not home_lobby:
            issues.append("缺少 '进入大厅' 按钮")

        print(f"'开始练习' 按钮: {'存在' if home_practice else '不存在'}")
        print(f"'进入大厅' 按钮: {'存在' if home_lobby else '不存在'}")

        # 2. 点击开始练习
        print("\n" + "=" * 60)
        print("步骤 2: 点击 '开始练习' 创建练习房间")
        print("=" * 60)

        if home_practice:
            home_practice.click()
            time.sleep(5)  # 等待游戏页面初始化

            current_url = page.url
            print(f"✓ 当前 URL: {current_url}")

            # 检查游戏页面元素
            game_page_elements = {
                "room-hand": page.query_selector('[data-testid="room-hand"]'),
                "room-play": page.query_selector('[data-testid="room-play"]'),
                "room-cards": page.query_selector('[data-testid="room-cards"]'),
            }

            print("\n游戏页面元素检查:")
            for name, element in game_page_elements.items():
                status = "存在" if element else "不存在"
                print(f"  {name}: {status}")
                if not element:
                    issues.append(f"缺少 {name} 元素")

            # 3. 检查手牌
            print("\n" + "=" * 60)
            print("步骤 3: 检查手牌状态")
            print("=" * 60)

            hand_element = page.query_selector('[data-testid="room-cards"]')
            if hand_element:
                cards = hand_element.query_selector_all('[data-card-id]')
                print(f"✓ 手牌数量: {len(cards)}")

                if len(cards) == 0:
                    issues.append("手牌为空，游戏可能未正确初始化")
            else:
                issues.append("无法找到手牌容器")
                print("✗ 无法找到手牌容器")

            # 4. 检查游戏状态
            print("\n" + "=" * 60)
            print("步骤 4: 检查游戏状态")
            print("=" * 60)

            # 尝试从页面获取游戏状态
            game_info = page.evaluate("""() => {
                // 尝试从 window 或 DOM 获取游戏状态
                const info = {
                    hasGameStore: typeof window !== 'undefined' && 'useGameStore' in (window as any),
                    hasRoomStore: typeof window !== 'undefined' && 'useRoomStore' in (window as any),
                    title: document.title,
                    url: window.location.href
                };
                return info;
            }""")

            print(f"游戏信息: {json.dumps(game_info, indent=2, ensure_ascii=False)}")

            # 5. 尝试出牌（模拟游戏操作）
            print("\n" + "=" * 60)
            print("步骤 5: 尝试出牌操作")
            print("=" * 60)

            cards = page.query_selector_all('[data-card-id]')
            if cards and len(cards) > 0:
                print(f"✓ 找到 {len(cards)} 张牌")

                # 尝试点击第一张牌
                try:
                    first_card = cards[0]
                    card_id = first_card.get_attribute('data-card-id')
                    print(f"点击第一张牌: {card_id}")
                    first_card.click()
                    time.sleep(1)

                    # 检查是否有出牌按钮
                    play_button = page.query_selector('[data-testid="room-play"]')
                    if play_button:
                        print("✓ 找到出牌按钮")
                        # play_button.click()
                        # time.sleep(2)
                        # print("✓ 已点击出牌")
                    else:
                        issues.append("无法找到出牌按钮")
                        print("✗ 无法找到出牌按钮")

                except Exception as e:
                    issues.append(f"出牌操作失败: {e}")
                    print(f"✗ 出牌操作失败: {e}")
            else:
                issues.append("没有可用的牌进行出牌")

        # 等待一段时间观察控制台
        print("\n" + "=" * 60)
        print("等待观察控制台输出...")
        print("=" * 60)
        time.sleep(3)

        # 6. 汇总结果
        print("\n" + "=" * 60)
        print("测试摘要")
        print("=" * 60)
        print(f"控制台消息总数: {len(console_messages)}")
        print(f"控制台错误: {len(console_errors)}")
        print(f"页面错误: {len(page_errors)}")
        print(f"发现问题: {len(issues)}")

        if console_errors:
            print("\n--- 控制台错误详情 ---")
            for i, err in enumerate(console_errors[:10], 1):
                print(f"{i}. {err['text']}")

        if page_errors:
            print("\n--- 页面错误详情 ---")
            for i, err in enumerate(page_errors[:10], 1):
                print(f"{i}. {err['message']}")

        if issues:
            print("\n--- 发现的问题 ---")
            for i, issue in enumerate(issues, 1):
                print(f"{i}. {issue}")

        # 保存详细日志
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "console_messages": console_messages,
            "console_errors": console_errors,
            "page_errors": page_errors,
            "issues": issues,
            "summary": {
                "total_console_messages": len(console_messages),
                "total_console_errors": len(console_errors),
                "total_page_errors": len(page_errors),
                "total_issues": len(issues)
            }
        }

        log_file = "test-results/full-game-flow-test.json"
        import os
        os.makedirs("test-results", exist_ok=True)
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        print(f"\n详细日志已保存到: {log_file}")

        browser.close()

        return {
            "console_errors": len(console_errors),
            "page_errors": len(page_errors),
            "issues": len(issues),
            "success": len(console_errors) == 0 and len(page_errors) == 0 and len(issues) == 0
        }

if __name__ == "__main__":
    result = test_full_game_flow()
    exit(0 if result["success"] else 1)
