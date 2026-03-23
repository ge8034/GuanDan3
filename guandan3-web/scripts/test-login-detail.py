#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
详细测试匿名登录和导航
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 60)
print("详细测试匿名登录和导航")
print("=" * 60)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    all_logs = []
    def on_console(msg):
        all_logs.append({"type": msg.type, "text": msg.text})
        print(f"[{msg.type.upper()}] {msg.text}")

    page.on("console", on_console)

    # 监控路由变化
    page.on("load", lambda: print(f"[NAV] Page loaded: {page.url}"))
    page.on("framenavigated", lambda f: print(f"[NAV] Frame navigated: {f.url}"))

    print("\n步骤 1: 访问首页")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)
    print(f"首页URL: {page.url}")

    print("\n步骤 2: 点击 '开始练习' 按钮")
    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        print("找到按钮，点击...")
        button.click()

        print("\n等待25秒观察变化...")
        for i in range(25):
            time.sleep(1)
            current_url = page.url
            if i % 5 == 0:
                print(f"  {i}s - URL: {current_url}")

    print(f"\n最终 URL: {page.url}")

    # 检查是否有任何错误
    errors = [log for log in all_logs if log["type"] == "error"]
    if errors:
        print(f"\n发现 {len(errors)} 个错误:")
        for err in errors[:10]:
            print(f"  - {err['text']}")

    # 检查特定关键日志
    print("\n关键日志分析:")
    keywords = ['登录', 'auth', '匿名', 'createPracticeRoom', 'RPC', 'roomId', 'router', 'navigate']
    for log in all_logs:
        for kw in keywords:
            if kw.lower() in log['text'].lower():
                print(f"  [{kw}] {log['text']}")
                break

    print("\n" + "=" * 60)
    browser.close()
