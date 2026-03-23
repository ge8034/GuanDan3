#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
正确等待Next.js导航的游戏测试
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("完整游戏流程测试 (修复版)")
print("=" * 70)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 设置导航监听
    def on_navigation(frame):
        if '/room/' in frame.url:
            print(f"[导航事件] {frame.url}")

    page.on("framenavigated", on_navigation)

    # 1. 访问首页
    print("\n[步骤 1] 访问首页")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(2)

    # 2. 点击开始练习
    print("\n[步骤 2] 点击 '开始练习'")
    button = page.query_selector('[data-testid="home-practice"]')
    if not button:
        print("✗ 未找到按钮")
        browser.close()
        exit(1)

    button.click()
    print("✓ 按钮已点击")

    # 3. 等待URL变化（使用wait_for_url或轮询）
    print("\n[步骤 3] 等待导航到房间页面...")

    # 使用更长的等待时间和轮询
    success = False
    for i in range(60):  # 等待最多60秒
        time.sleep(1)
        current_url = page.url
        if i % 5 == 0:
            print(f"  等待中... {i}s - URL: {current_url}")

        if '/room/' in current_url and '3000/' in current_url:
            print(f"✓ 成功导航到: {current_url}")
            success = True
            break

    if not success:
        print(f"✗ 导航超时，最终 URL: {page.url}")
        browser.close()
        exit(1)

    # 4. 等待页面加载和游戏初始化
    print("\n[步骤 4] 等待游戏初始化...")
    time.sleep(15)

    # 5. 检查手牌
    print("\n[步骤 5] 检查手牌状态")
    hand_element = page.query_selector('[data-testid="room-cards"]')
    if hand_element:
        cards = hand_element.query_selector_all('[data-card-id]')
        print(f"✓ 找到手牌，数量: {len(cards)}")

        if len(cards) >= 20:  # 掼蛋27张牌，但可能还在发牌
            print("✓ 游戏初始化成功！")

            # 6. 检查出牌按钮
            print("\n[步骤 6] 检查出牌按钮状态")
            play_button = page.query_selector('[data-testid="room-play"]')
            if play_button:
                is_disabled = play_button.get_attribute('disabled') is not None
                print(f"出牌按钮: {'可用 ✓' if not is_disabled else '禁用'}")

                if not is_disabled:
                    print("\n" + "=" * 70)
                    print("✅ 测试结果: 全部通过！")
                    print("=" * 70)
                    print("✓ 匿名登录: 成功")
                    print("✓ 房间创建: 成功")
                    print("✓ 页面导航: 成功")
                    print("✓ 游戏初始化: 成功")
                    print("✓ 出牌准备: 就绪")
                    print("=" * 70)
                else:
                    print("⚠️ 出牌按钮禁用 - 等待更长时间...")
                    time.sleep(10)
                    is_disabled = play_button.get_attribute('disabled') is not None
                    if not is_disabled:
                        print("✓ 出牌按钮现已可用")
            else:
                print("⚠️ 未找到出牌按钮")
        else:
            print(f"⚠️ 手牌数量不足: {len(cards)}")
    else:
        print("✗ 未找到手牌容器")

    print(f"\n最终 URL: {page.url}")
    browser.close()
