"""
检查 games 查询的详细响应
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_response_detailed():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()

        # 记录完整的请求和响应
        request_log = []

        def log_request(request):
            if "supabase" in request.url and "games" in request.url:
                request_log.append({
                    "type": "request",
                    "url": request.url,
                    "method": request.method
                })

        def log_response(response):
            if "supabase" in response.url and "games" in response.url:
                try:
                    # 尝试获取响应体
                    body = response.text()
                    request_log.append({
                        "type": "response",
                        "url": response.url[:100],
                        "status": response.status,
                        "body": body[:200] if body else None
                    })
                    print(f"[{response.status}] {response.url[:80]}")
                except:
                    request_log.append({
                        "type": "response",
                        "url": response.url[:100],
                        "status": response.status,
                        "body": None
                    })
                    print(f"[{response.status}] {response.url[:80]} (no body)")

        page = browser.new_page()
        page.on("request", log_request)
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

        # 清空之前的日志
        request_log.clear()

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 分析日志
            print("\n=== games 查询详细分析 ===")
            games_logs = [log for log in request_log if "games" in log.get("url", "")]
            print(f"games 相关日志: {len(games_logs)}")

            for i, log in enumerate(games_logs):
                print(f"\n{i+1}. 类型: {log['type']}")
                print(f"   URL: {log['url']}")
                if log['type'] == 'response':
                    print(f"   状态码: {log['status']}")
                    print(f"   响应体: {log['body']}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_response_detailed()
