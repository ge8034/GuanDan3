#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用正确选择器的完整游戏测试
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("完整游戏测试 (修正版)")
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

    # 2. 等待游戏初始化
    print("\n[2] 等待游戏初始化...")
    time.sleep(20)

    # 3. 检查状态
    print("\n[3] 检查游戏状态")

    path = page.evaluate("() => window.location.pathname")
    print(f"  路径: {path}")

    # 使用正确的选择器检查手牌
    hand_container = page.query_selector('[data-testid="room-hand"]')
    if hand_container:
        # 尝试找到CardView组件
        cards = page.query_selector_all('[data-card-id]')
        print(f"  手牌数量: {len(cards)}")

        if len(cards) > 0:
            print(f"  ✓ 游戏已初始化！")
        else:
            print(f"  ⚠️ 手牌容器存在但没有牌")
    else:
        print(f"  ✗ 未找到手牌容器")

    # 检查出牌按钮
    play_button = page.query_selector('[data-testid="room-play"]')
    if play_button:
        is_disabled = play_button.get_attribute('disabled') is not None
        print(f"  出牌按钮: {'可用' if not is_disabled else '禁用'}")

    # 4. 结果
    print("\n" + "=" * 70)

    if '/room/' in path and len(cards) > 0:
        print("✅ 测试成功！")
        print("   ✓ 匿名登录成功")
        print("   ✓ 房间创建成功")
        print("   ✓ 页面导航成功")
        print(f"   ✓ 游戏初始化成功 ({len(cards)}张牌)")

        if not play_button.get_attribute('disabled'):
            print("   ✓ 玩家可以出牌！")
    else:
        print("⚠️ 部分功能可用")
        if '/room/' in path:
            print("   ✓ 导航成功")

    print(f"\n最终路径: {path}")
    print(f"手牌数量: {len(cards) if cards else 0}")

    browser.close()
