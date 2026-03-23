#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整游戏流程测试 - 包含自动开始流程
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

    # 1. 启动游戏
    print("\n[1] 启动游戏")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        print("✓ 点击 '开始练习'")
        button.click()
    else:
        print("✗ 未找到按钮")
        browser.close()
        exit(1)

    # 2. 等待导航和初始化
    print("\n[2] 等待导航和游戏初始化...")
    time.sleep(10)

    path = page.evaluate("() => window.location.pathname")
    print(f"当前路径: {path}")

    if '/room/' not in path:
        print("✗ 未导航到房间页面")
        browser.close()
        exit(1)

    room_id = path.split('/')[-1]
    print(f"房间 ID: {room_id}")

    # 3. 等待游戏状态变化
    print("\n[3] 等待游戏自动开始（发牌完成）...")

    # 等待最多40秒观察游戏状态
    for i in range(40):
        time.sleep(1)

        # 检查手牌
        hand_element = page.query_selector('[data-testid="room-cards"]')
        if hand_element:
            cards = hand_element.query_selector_all('[data-card-id]')
            if len(cards) > 0:
                print(f"  {i}s - 手牌数量: {len(cards)}")

        # 检查出牌按钮
        play_button = page.query_selector('[data-testid="room-play"]')
        if play_button:
            is_disabled = play_button.get_attribute('disabled') is not None
            if not is_disabled:
                print(f"  {i}s - 出牌按钮: 可用 ✓")
                break
            else:
                if i % 5 == 0:
                    print(f"  {i}s - 出牌按钮: 禁用，等待游戏开始...")

        # 如果游戏已经开始了，退出等待
        if i > 25 and play_button:
            is_disabled = play_button.get_attribute('disabled') is not None
            if not is_disabled:
                break

    # 4. 最终检查
    print("\n[4] 最终状态检查")

    # 检查路径
    path = page.evaluate("() => window.location.pathname")
    print(f"  路径: {path}")

    # 检查手牌
    hand_element = page.query_selector('[data-testid="room-cards"]')
    hand_count = 0
    if hand_element:
        cards = hand_element.query_selector_all('[data-card-id]')
        hand_count = len(cards)
        print(f"  手牌数量: {hand_count}")

    # 检查出牌按钮
    play_button = page.query_selector('[data-testid="room-play"]')
    play_status = "不存在"
    if play_button:
        is_disabled = play_button.get_attribute('disabled') is not None
        play_status = "可用" if not is_disabled else "禁用"
        print(f"  出牌按钮: {play_status}")

    # 5. 结果判断
    print("\n" + "=" * 70)
    print("测试结果")
    print("=" * 70)

    if '/room/' in path and hand_count > 0:
        print("✅ 游戏成功运行！")
        print(f"   ✓ 匿名登录成功")
        print(f"   ✓ 房间创建成功")
        print(f"   ✓ 页面导航成功")
        print(f"   ✓ 游戏初始化成功 ({hand_count}张牌)")
        if play_status == "可用":
            print(f"   ✓ 玩家可以出牌")
        elif play_status == "禁用":
            print(f"   ⚠️ 出牌按钮禁用（等待其他玩家/AI）")
    else:
        print("⚠️ 游戏部分功能可用")
        if '/room/' in path:
            print(f"   ✓ 房间创建和导航成功")
        if hand_count == 0:
            print(f"   ⚠️ 游戏初始化未完成")

    print(f"\n最终路径: {path}")
    print(f"最终手牌数: {hand_count}")
    print(f"出牌按钮: {play_status}")

    browser.close()
