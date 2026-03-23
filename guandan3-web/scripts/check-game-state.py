#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
检查游戏状态和自动开始
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("游戏状态检查")
print("=" * 70)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 启动游戏
    print("\n启动游戏...")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        button.click()
        time.sleep(15)

    # 检查游戏状态
    print("\n检查游戏状态:")
    game_state = page.evaluate("""() => {
        // 尝试从页面获取游戏信息
        const info = {
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            // 检查DOM中的游戏元素
            hasRoomHeader: !!document.querySelector('[data-testid="room-header"]'),
            hasHandCards: !!document.querySelector('[data-testid="room-cards"]'),
            hasPlayButton: !!document.querySelector('[data-testid="room-play"]'),
            hasPassButton: !!document.querySelector('[data-testid="room-pass"]'),
            playButtonDisabled: document.querySelector('[data-testid="room-play"]')?.disabled,
        };
        return info;
    }""")

    print(f"游戏状态: {game_state}")

    if game_state.get('pathname', '').startswith('/room/'):
        print("✓ 在房间页面")

        if not game_state.get('hasHandCards'):
            print("\n手牌未显示，尝试手动触发游戏开始...")

            # 尝试点击房间中的"开始"按钮
            start_button = page.query_selector('button:has-text("开始游戏")')
            if start_button:
                print("找到 '开始游戏' 按钮，点击...")
                start_button.click()
                time.sleep(15)
            else:
                print("未找到 '开始游戏' 按钮")

            # 再次检查
            hand_element = page.query_selector('[data-testid="room-cards"]')
            if hand_element:
                cards = hand_element.query_selector_all('[data-card-id]')
                print(f"点击后手牌数量: {len(cards)}")

    browser.close()
