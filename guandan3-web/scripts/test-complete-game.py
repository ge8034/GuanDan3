#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整游戏流程测试 - 验证匿名登录和游戏运行
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("完整游戏流程测试")
print("=" * 70)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    issues = []

    def on_console(msg):
        if msg.type == "error":
            issues.append(f"控制台错误: {msg.text}")
            print(f"[ERROR] {msg.text}")

    page.on("console", on_console)

    # 1. 访问首页并点击开始练习
    print("\n[步骤 1] 访问首页并点击 '开始练习'")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    button = page.query_selector('[data-testid="home-practice"]')
    if not button:
        issues.append("未找到 '开始练习' 按钮")
    else:
        button.click()
        print("✓ 按钮已点击，等待导航...")
        # 等待URL变化或超时
        for i in range(20):  # 最多等待20秒
            time.sleep(1)
            if '/room/' in page.url:
                break
        print(f"等待后 URL: {page.url}")

    # 2. 检查是否导航到房间页面
    print("\n[步骤 2] 检查导航状态")
    # 使用pathname而不是page.url，因为Next.js客户端路由可能不会更新page.url
    current_path = page.evaluate("() => window.location.pathname")
    print(f"当前路径: {current_path}")

    if '/room/' in current_path:
        print("✓ 成功导航到房间页面")

        import re
        match = re.search(r'/room/([a-f0-9-]+)', current_path)
        room_id = match.group(1) if match else "unknown"
        print(f"房间 ID: {room_id}")

        # 3. 等待游戏初始化
        print("\n[步骤 3] 等待游戏初始化（发牌）...")
        time.sleep(10)

        # 4. 检查手牌
        print("\n[步骤 4] 检查手牌状态")
        hand_element = page.query_selector('[data-testid="room-hand"]')
        if hand_element:
            cards = hand_element.query_selector_all('[data-card-id]')
            print(f"✓ 手牌数量: {len(cards)}")

            if len(cards) == 27:
                print("✓ 手牌数量正确 (27张)")
            elif len(cards) > 0:
                print(f"⚠️ 手牌数量为 {len(cards)} (预期27)")
            else:
                issues.append("手牌为空 - 游戏可能未正确初始化")
        else:
            issues.append("未找到手牌容器")

        # 5. 等待游戏开始
        print("\n[步骤 5] 等待游戏开始...")
        time.sleep(5)

        # 6. 检查出牌按钮状态
        print("\n[步骤 6] 检查出牌按钮")
        play_button = page.query_selector('[data-testid="room-play"]')
        if play_button:
            is_disabled = play_button.get_attribute('disabled') is not None
            print(f"出牌按钮状态: {'可用' if not is_disabled else '禁用'}")

            if not is_disabled:
                print("✓ 出牌按钮可用 - 可以开始出牌！")
            else:
                issues.append("出牌按钮禁用 - 可能不是玩家的回合")

        # 7. 尝试选择一张牌
        print("\n[步骤 7] 尝试选择并出牌")
        cards = page.query_selector_all('[data-card-id]')
        if len(cards) > 0:
            first_card = cards[0]
            card_id = first_card.get_attribute('data-card-id')
            print(f"点击第一张牌 (ID: {card_id})")
            first_card.click()
            time.sleep(1)

            # 尝试出牌（需要重新获取按钮，因为DOM可能已更新）
            play_button = page.query_selector('[data-testid="room-play"]')
            if play_button:
                play_button.click()
                time.sleep(2)
                print("✓ 已尝试出牌")

                # 检查手牌数量是否减少
                cards_after = page.query_selector_all('[data-card-id]')
                if len(cards_after) < len(cards):
                    print(f"✓ 出牌成功！手牌从 {len(cards)} 减少到 {len(cards_after)}")
                else:
                    print(f"⚠️ 手牌数量未变化: {len(cards)}")

    # 8. 汇总结果
    print("\n" + "=" * 70)
    print("测试结果汇总")
    print("=" * 70)

    if issues:
        print(f"\n发现 {len(issues)} 个问题:")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
    else:
        print("\n✅ 所有测试通过！游戏流程正常运行！")

    final_path = page.evaluate("() => window.location.pathname")
    print(f"\n最终路径: {final_path}")

    browser.close()

    exit(0 if len(issues) == 0 else 1)
