#!/usr/bin/env python3
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("扩展等待测试...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    # 捕获所有控制台
    all_logs = []
    def on_console(msg):
        all_logs.append(msg.text)
        if 'AutoStart' in msg.text or 'fetchGame' in msg.text or '手牌' in msg.text:
            print(f"[{msg.type}] {msg.text}")

    page.on("console", on_console)

    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(2)

    button = page.query_selector('[data-testid="home-practice"]')
    if button:
        button.click()
        print("等待60秒观察游戏初始化...")

        for i in range(60):
            time.sleep(1)

            # 每5秒检查一次手牌
            if i % 5 == 0:
                cards = page.query_selector_all('[data-card-id]')
                path = page.evaluate("() => window.location.pathname")
                play_btn = page.query_selector('[data-testid="room-play"]')
                is_disabled = play_btn.get_attribute('disabled') if play_btn else None
                print(f"  {i}s - 路径:{path} 手牌:{len(cards)} 出牌按钮:{'禁用' if is_disabled else '可用'}")

                if len(cards) >= 27:
                    print(f"\n✅ 成功！手牌已发完 ({len(cards)}张)")
                    break

    # 最终状态
    print(f"\n最终: {page.url}")
    cards = page.query_selector_all('[data-card-id]')
    print(f"最终手牌数: {len(cards)}")

    # 打印AutoStart相关日志
    print("\nAutoStart日志:")
    for log in all_logs:
        if 'AutoStart' in log:
            print(f"  {log}")

    browser.close()
