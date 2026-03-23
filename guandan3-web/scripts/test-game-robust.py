#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
健壮的完整游戏测试
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("完整游戏流程测试 (健壮版)")
print("=" * 70)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 监控所有导航事件
    navigated_urls = []
    def handle_navigation(frame):
        navigated_urls.append(frame.url)
        print(f"[导航] {frame.url}")

    page.on("framenavigated", handle_navigation)

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

    print(f"点击前 URL: {page.url}")
    button.click()

    # 3. 等待导航（最多30秒）
    print("\n[步骤 3] 等待导航到房间页面...")
    start_time = time.time()
    target_url = None

    while time.time() - start_time < 30:
        time.sleep(0.5)
        current_url = page.url

        if '/room/' in current_url and current_url != "http://localhost:3000/":
            target_url = current_url
            print(f"✓ 检测到导航: {current_url}")
            break

        # 也检查navigated_urls
        for url in navigated_urls:
            if '/room/' in url:
                target_url = url
                print(f"✓ 检测到导航事件: {url}")
                break
        if target_url:
            break

    if not target_url:
        print(f"✗ 未检测到导航，最终 URL: {page.url}")
        print(f"导航事件记录: {navigated_urls}")
        browser.close()
        exit(1)

    # 4. 等待页面加载
    print("\n[步骤 4] 等待页面完全加载...")
    time.sleep(10)

    # 5. 检查手牌
    print("\n[步骤 5] 检查手牌")
    hand_element = page.query_selector('[data-testid="room-cards"]')
    if not hand_element:
        print("⚠️ 未立即找到手牌容器，继续等待...")
        time.sleep(10)
        hand_element = page.query_selector('[data-testid="room-cards"]')

    if hand_element:
        cards = hand_element.query_selector_all('[data-card-id]')
        print(f"✓ 找到手牌容器，手牌数量: {len(cards)}")

        if len(cards) > 0:
            print(f"✓ 游戏已成功初始化！")

            # 6. 检查出牌按钮
            print("\n[步骤 6] 检查出牌按钮")
            play_button = page.query_selector('[data-testid="room-play"]')
            if play_button:
                is_disabled = play_button.get_attribute('disabled') is not None
                print(f"出牌按钮: {'可用 ✓' if not is_disabled else '禁用'}")

                if not is_disabled:
                    print("\n✅ 游戏完全正常运行！")
                    print("   - 匿名登录: 成功")
                    print("   - 房间创建: 成功")
                    print("   - 游戏初始化: 成功")
                    print("   - 玩家回合: 准备就绪")
                else:
                    print("\n⚠️ 出牌按钮禁用 - 可能不是玩家回合")
            else:
                print("⚠️ 未找到出牌按钮")
        else:
            print("✗ 手牌为空")
    else:
        print("✗ 未找到手牌容器")

    print("\n" + "=" * 70)
    print(f"最终 URL: {page.url}")
    browser.close()
