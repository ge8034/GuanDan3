#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单测试 - 检查按钮点击和日志
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

print("启动测试...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # 显示浏览器以便观察
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    console_logs = []
    def on_console(msg):
        text = msg.text
        console_logs.append(text)
        print(f"[CONSOLE] {text}")

    page.on("console", on_console)

    print("访问首页...")
    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    print(f"当前URL: {page.url}")

    # 查找按钮
    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        print("找到'开始练习'按钮")
        print("点击按钮...")
        button.click()

        print("等待30秒观察...")
        time.sleep(30)

        print(f"\n最终URL: {page.url}")

        # 打印相关日志
        print("\n相关日志:")
        for log in console_logs:
            if 'createPracticeRoom' in log or 'RPC' in log or 'roomId' in log or '导航' in log:
                print(f"  {log}")
    else:
        print("未找到按钮")

    print("\n按Enter关闭浏览器...")
    input()

    browser.close()
