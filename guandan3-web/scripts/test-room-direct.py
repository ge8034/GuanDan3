#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接访问已创建的房间进行测试
"""
import sys
import io
from playwright.sync_api import sync_playwright
import json
import time
import os
from datetime import datetime

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def main():
    print("=" * 60)
    print("直接访问房间测试")
    print("=" * 60)

    # 从之前的测试中获取一个房间ID，或使用固定ID
    test_room_id = "85c553b5-18a9-4cd2-b6bf-789392e4d074"  # 使用之前测试中看到的房间ID

    console_messages = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        def on_console(msg):
            entry = {"type": msg.type, "text": msg.text}
            console_messages.append(entry)
            if msg.type == "error":
                print(f"[ERROR] {msg.text}")

        page.on("console", on_console)

        # 直接导航到房间页面
        print(f"\n直接导航到: /room/{test_room_id}")
        page.goto(f"http://localhost:3000/room/{test_room_id}", wait_until="networkidle", timeout=60000)
        time.sleep(10)

        # 检查状态
        print(f"\n当前 URL: {page.url}")

        # 检查手牌
        hand_element = page.query_selector('[data-testid="room-cards"]')
        if hand_element:
            cards = hand_element.query_selector_all('[data-card-id]')
            print(f"✓ 找到手牌，数量: {len(cards)}")
        else:
            print("✗ 无法找到手牌")

        # 检查出牌按钮
        play_button = page.query_selector('[data-testid="room-play"]')
        if play_button:
            is_disabled = play_button.get_attribute('disabled') is not None
            print(f"出牌按钮: {'禁用' if is_disabled else '可用'}")

        # 等待更长时间让游戏初始化
        print("\n等待15秒让游戏完全初始化...")
        time.sleep(15)

        # 再次检查
        hand_element = page.query_selector('[data-testid="room-cards"]')
        if hand_element:
            cards = hand_element.query_selector_all('[data-card-id]')
            print(f"等待后手牌数量: {len(cards)}")

        browser.close()

if __name__ == "__main__":
    main()
