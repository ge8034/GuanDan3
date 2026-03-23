"""
简化测试 - 直接检查浏览器网络请求
"""
from playwright.sync_api import sync_playwright
import time

def test_simple():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()

        # 启用网络日志
        page = browser.new_page()

        # 记录请求
        games_requests = []
        hands_requests = []

        page.on("request", lambda request: None)
        page.on("response", lambda response: (
            games_requests.append(response.url) if "games" in response.url and "supabase" in response.url else None,
            hands_requests.append(response.url) if "game_hands" in response.url and "supabase" in response.url else None
        ))

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
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 检查请求
            print("\n=== Supabase games 请求 ===")
            print(f"games 请求: {len(games_requests)}")
            for req in games_requests:
                print(f"  {req[:150]}")

            print("\n=== Supabase game_hands 请求 ===")
            print(f"game_hands 请求: {len(hands_requests)}")
            for req in hands_requests:
                print(f"  {req[:150]}")

            # 检查手牌区域
            print("\n=== 检查手牌区域 ===")
            hand_area = page.locator('[data-testid="room-hand"]')
            print(f"手牌区域存在: {hand_area.count() > 0}")
            if hand_area.count() > 0:
                print(f"手牌区域可见: {hand_area.is_visible()}")
                cards = hand_area.locator('[data-card-id]').count()
                print(f"卡牌数量: {cards}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_simple()
