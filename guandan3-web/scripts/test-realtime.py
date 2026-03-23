"""
测试 Realtime 订阅
"""
from playwright.sync_api import sync_playwright
import time

def test_realtime():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = browser.new_page()

        # 检查控制台日志，特别关注 "Game Update" 相关的日志
        game_updates = []

        def on_console(msg):
            text = msg.text
            if "Game Update" in text or "Store" in text or "subscribe" in text.lower():
                game_updates.append(text)
                print(f"[LOG] {text[:150]}")

        page.on("console", on_console)

        print("=== 访问首页并点击开始练习 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        page.locator('[data-testid="home-practice"]').click()

        # 等待导航
        page.wait_for_url("**/room/**", timeout=10000)
        room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
        print(f"房间ID: {room_id}")

        # 等待页面加载
        page.wait_for_timeout(5000)

        print("\n=== 点击开始游戏前：Realtime 状态 ===")
        # 检查是否已经订阅
        pre_check = page.evaluate("""() => {
            return {
                hasSupabase: typeof window.supabase !== 'undefined',
            }
        }""")
        print(f"预检查: {pre_check}")

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 检查游戏更新日志
            print("\n=== 游戏更新日志 ===")
            print(f"总日志数: {len(game_updates)}")

            # 筛选与游戏插入相关的日志
            insert_logs = [log for log in game_updates if "INSERT" in log or "insert" in log.lower()]
            update_logs = [log for log in game_updates if "playing" in log or "status" in log.lower()]

            print(f"INSERT 相关日志: {len(insert_logs)}")
            for log in insert_logs[:5]:
                print(f"  {log[:150]}")

            print(f"playing 状态日志: {len(update_logs)}")
            for log in update_logs[:5]:
                print(f"  {log[:150]}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_realtime()
