"""
详细测试游戏页面并捕获完整控制台日志
"""
from playwright.sync_api import sync_playwright
import time

def test_game_detailed():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        all_messages = []

        def on_console(msg):
            all_messages.append({
                "type": msg.type,
                "text": msg.text,
                "url": page.url
            })
            print(f"[{msg.type.upper()}] {msg.text[:150]}")

        page.on("console", on_console)

        print("访问首页...")
        page.goto("http://localhost:3000", wait_until="domcontentloaded", timeout=60000)
        time.sleep(2)

        print(f"首页标题: {page.title()}")

        # 尝试点击开始练习
        print("点击开始练习按钮...")
        try:
            practice_btn = page.locator('[data-testid="home-practice"]')
            practice_btn.click(timeout=5000)
            time.sleep(5)

            print(f"当前URL: {page.url}")
            print(f"页面标题: {page.title()}")

            # 检查游戏页面状态
            page_content = page.content()

            # 检查关键元素
            checks = {
                "room-hand": page.query_selector('[data-testid="room-hand"]'),
                "room-play": page.query_selector('[data-testid="room-play"]'),
                "room-pass": page.query_selector('[data-testid="room-pass"]'),
                "room-hint": page.query_selector('[data-testid="room-hint"]'),
            }

            print("\n元素存在性检查:")
            for name, el in checks.items():
                print(f"  {name}: {'YES' if el else 'NO'}")

            # 检查是否有错误消息在页面上
            error_elements = page.query_selector_all('[class*="error"], [class*="Error"], [role="alert"]')
            if error_elements:
                print(f"\n页面上的错误元素: {len(error_elements)}")
                for el in error_elements[:3]:
                    print(f"  - {el.text_content()[:100]}")

            # 检查游戏状态
            game_info = page.evaluate("""() => {
                return {
                    hasGame: typeof window !== 'undefined',
                    location: window.location.href,
                    title: document.title
                }
            }""")
            print(f"\n游戏信息: {game_info}")

        except Exception as e:
            print(f"错误: {e}")

        print("\n=== 控制台消息汇总 ===")
        error_count = sum(1 for m in all_messages if m["type"] == "error")
        warning_count = sum(1 for m in all_messages if m["type"] == "warning")
        print(f"总消息: {len(all_messages)}")
        print(f"错误: {error_count}")
        print(f"警告: {warning_count}")

        if error_count > 0:
            print("\n所有错误:")
            for m in all_messages:
                if m["type"] == "error":
                    print(f"  [{m['url']}] {m['text']}")

        browser.close()

test_game_detailed()
