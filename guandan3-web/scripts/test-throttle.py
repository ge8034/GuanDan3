"""
测试 throttle 延迟问题
"""
from playwright.sync_api import sync_playwright
import time

def test_throttle():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = browser.new_page()

        # 收集所有日志
        all_logs = []

        def on_console(msg):
            text = msg.text
            if "Store" in text or "fetchGame" in text or "Event" in text:
                all_logs.append(text)
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

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()

            # 等待更长时间以观察 throttle 执行
            print("等待游戏初始化（15秒）...")
            page.wait_for_timeout(15000)

            # 检查是否有 fetchGame 日志
            print("\n=== 检查 fetchGame 调用 ===")
            fetchgame_logs = [log for log in all_logs if "fetchGame" in log]
            print(f"fetchGame 相关日志: {len(fetchgame_logs)}")
            for log in fetchgame_logs:
                print(f"  {log}")

            # 检查手牌区域
            print("\n=== 检查手牌区域 ===")
            hand_area = page.locator('[data-testid="room-hand"]')
            if hand_area.count() > 0:
                cards = hand_area.locator('[data-card-id]').count()
                print(f"手牌区域卡牌数量: {cards}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_throttle()
