#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
捕获所有控制台消息
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("游戏状态检查 - 详细日志")
print("=" * 70)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    all_messages = []
    def on_console(msg):
        text = msg.text
        all_messages.append({"type": msg.type, "text": text})
        # 打印所有日志
        print(f"[{msg.type}] {text}")

    page.on("console", on_console)

    print("\n启动游戏...")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(2)

    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        print("\n点击按钮...")
        button.click()
    else:
        print("未找到按钮")
        browser.close()
        exit(1)

    print("\n等待30秒观察日志...")
    time.sleep(30)

    print("\n" + "=" * 70)
    print("AutoStart 相关日志:")
    for msg in all_messages:
        if 'AutoStart' in msg['text'] or 'auto' in msg['text'].lower():
            print(f"  {msg['text']}")

    print("\n当前状态:")
    path = page.evaluate("() => window.location.pathname")
    print(f"  路径: {path}")

    hand_element = page.query_selector('[data-testid="room-hand"]')
    if hand_element:
        cards = hand_element.query_selector_all('[data-card-id]')
        print(f"  手牌: {len(cards)} 张")
    else:
        print(f"  手牌: 无")

    play_button = page.query_selector('[data-testid="room-play"]')
    if play_button:
        is_disabled = play_button.get_attribute('disabled') is not None
        print(f"  出牌按钮: {'禁用' if is_disabled else '可用'}")

    browser.close()
