"""
检查 games 查询响应
"""
from playwright.sync_api import sync_playwright
import time

def test_response():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = browser.new_page()

        # 记录响应状态
        responses = []

        def log_response(response):
            if "supabase" in response.url:
                responses.append({
                    "url": response.url[:100],
                    "status": response.status,
                    "ok": response.ok
                })
                print(f"[{response.status}] {response.url[:80]}")

        page.on("response", log_response)

        print("=== 访问首页并点击开始练习 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        page.locator('[data-testid="home-practice"]').click()

        # 等待导航
        page.wait_for_url("**/room/**", timeout=10000)
        room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
        print(f"房间ID: {room_id}")

        # 等待页面加载
        page.wait_for_timeout(5000)

        # 清空之前的响应
        responses.clear()

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 分析响应
            print("\n=== 响应分析 ===")
            games_responses = [r for r in responses if "games" in r["url"] and "supabase" in r["url"]]
            print(f"games 查询响应: {len(games_responses)}")
            for resp in games_responses:
                print(f"  状态码: {resp['status']}, OK: {resp['ok']}, URL: {resp['url']}")

            # 检查状态码
            success_responses = [r for r in games_responses if r['status'] == 200]
            empty_responses = [r for r in games_responses if r['status'] == 200 and 'maybeSingle' in resp['url']]
            not_found_responses = [r for r in games_responses if r['status'] == 404 or r['status'] == 406]

            print(f"\n成功响应 (200): {len(success_responses)}")
            print(f"可能为空 (maybeSingle): {len(empty_responses)}")
            print(f"未找到 (404/406): {len(not_found_responses)}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_response()
