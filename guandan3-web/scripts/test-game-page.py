"""
测试游戏页面并捕获控制台日志
用于发现运行时问题
"""
from playwright.sync_api import sync_playwright
import json
import time

def test_game_page():
    issues_found = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        console_messages = []
        console_errors = []

        def on_console(msg):
            msg_type = msg.type
            msg_text = msg.text
            console_messages.append({"type": msg_type, "text": msg_text})
            if msg_type == "error":
                console_errors.append(msg_text)
                print(f"[CONSOLE ERROR] {msg_text}")
            elif msg_type == "warning":
                print(f"[CONSOLE WARNING] {msg_text}")

        page.on("console", on_console)

        page_errors = []
        def on_page_error(error):
            page_errors.append(str(error))
            print(f"[PAGE ERROR] {error}")

        page.on("pageerror", on_page_error)

        print("=" * 60)
        print("访问首页...")
        print("=" * 60)

        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(2)

        print("首页标题:", page.title())

        home_practice = page.query_selector('[data-testid="home-practice"]')
        home_lobby = page.query_selector('[data-testid="home-enter-lobby"]')

        print(f"'开始练习' 按钮: {'存在' if home_practice else '不存在'}")
        print(f"'进入大厅' 按钮: {'存在' if home_lobby else '不存在'}")

        if not home_practice:
            issues_found.append("缺少 '开始练习' 按钮")
        if not home_lobby:
            issues_found.append("缺少 '进入大厅' 按钮")

        print("\n" + "=" * 60)
        print("点击 '开始练习' 创建练习房间...")
        print("=" * 60)

        if home_practice:
            home_practice.click()
            time.sleep(3)

            print("当前URL:", page.url)
            
            game_page_checks = {
                "room-hand": page.query_selector('[data-testid="room-hand"]'),
                "room-play": page.query_selector('[data-testid="room-play"]'),
            }

            print("\n游戏页面元素:")
            for name, element in game_page_checks.items():
                status = "存在" if element else "不存在"
                print(f"  {name}: {status}")
                if not element:
                    issues_found.append(f"缺少 {name} 元素")

        print("\n" + "=" * 60)
        print("测试摘要")
        print("=" * 60)
        print(f"控制台错误: {len(console_errors)}")
        print(f"页面错误: {len(page_errors)}")
        print(f"发现问题: {len(issues_found)}")

        if issues_found:
            print("\n发现的问题:")
            for i, issue in enumerate(issues_found[:5], 1):
                print(f"  {i}. {issue}")

        browser.close()
        return len(issues_found) == 0

if __name__ == "__main__":
    test_game_page()
