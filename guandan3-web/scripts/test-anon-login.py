#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试匿名登录是否启用
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("测试匿名登录功能")
print("=" * 60)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    console_logs = []
    def on_console(msg):
        text = msg.text
        console_logs.append(text)
        if '登录' in text or 'auth' in text.lower() or 'error' in text.lower() or 'room' in text.lower():
            print(f"[LOG] {text}")
        if msg.type == "error":
            print(f"[ERROR] {text}")

    page.on("console", on_console)

    # 访问首页
    print("\n步骤 1: 访问首页")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    # 点击开始练习
    print("\n步骤 2: 点击 '开始练习' 按钮")
    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        button.click()
        print("等待匿名登录和房间创建...")
        time.sleep(15)  # 等待足够的时间

        # 检查URL
        current_url = page.url
        print(f"\n当前 URL: {current_url}")

        if '/room/' in current_url:
            print("✓ 成功导航到房间页面！")

            # 提取房间ID
            import re
            match = re.search(r'/room/([a-f0-9-]+)', current_url)
            if match:
                room_id = match.group(1)
                print(f"房间 ID: {room_id}")

            # 检查手牌
            time.sleep(5)
            hand_element = page.query_selector('[data-testid="room-cards"]')
            if hand_element:
                cards = hand_element.query_selector_all('[data-card-id]')
                print(f"✓ 手牌数量: {len(cards)}")

                if len(cards) > 0:
                    print("\n✅ 匿名登录成功！游戏已正常初始化！")
                else:
                    print("\n⚠️ 手牌为空")
            else:
                print("\n⚠️ 无法找到手牌容器")
        else:
            print("✗ 未能导航到房间页面")

            # 分析日志
            print("\n分析相关日志:")
            for log in console_logs:
                if any(kw in log for kw in ['登录', 'auth', '匿名', 'anonymous', 'Error', 'error', 'Failed', '403', '401']):
                    print(f"  {log}")
    else:
        print("未找到按钮")

    print("\n" + "=" * 60)
    browser.close()
