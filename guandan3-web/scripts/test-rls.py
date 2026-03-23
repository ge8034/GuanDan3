"""
测试 RLS 策略和手牌查询
"""
from playwright.sync_api import sync_playwright
import time

def test_rls():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        # 记录所有 Supabase 请求和响应
        logs = []

        def handle_route(route, request):
            if "supabase" in request.url:
                logs.append(f"[REQUEST] {request.method} {request.url[:100]}")
            route.continue_()

        page.route("**/*", handle_route)

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

            # 检查 game_hands 相关的日志
            print("\n=== 检查 game_hands 查询 ===")
            game_hands_logs = [log for log in logs if "game_hands" in log]
            print(f"game_hands 相关日志: {len(game_hands_logs)}")
            for log in game_hands_logs:
                print(f"  {log}")

            # 手动测试查询
            print("\n=== 手动测试 game_hands 查询 ===")
            test_result = page.evaluate("""async () => {
                // 尝试通过 fetch API 调用 Supabase
                const response = await fetch('/api/test-game-hands', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'test' })
                })
                return { status: response.status, ok: response.ok }
            }""")

            print(f"测试 API 结果: {test_result}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_rls()
