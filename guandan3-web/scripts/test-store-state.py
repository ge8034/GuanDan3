"""
检查游戏 store 状态和 API 调用
"""
from playwright.sync_api import sync_playwright
import time

def test_store_state():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        # 收集 API 请求
        api_requests = []

        def on_request(request):
            if "supabase" in request.url:
                api_requests.append({
                    "url": request.url[:100],
                    "method": request.method
                })

        def on_response(response):
            if "supabase" in response.url:
                api_requests.append({
                    "url": response.url[:100],
                    "status": response.status
                })

        page.on("request", on_request)
        page.on("response", on_response)

        print("=== 访问首页并点击开始练习 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        page.locator('[data-testid="home-practice"]').click()

        # 等待导航
        page.wait_for_url("**/room/**", timeout=10000)
        room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
        print(f"房间ID: {room_id}")

        # 等待页面加载
        page.wait_for_timeout(5000)

        # 清空之前的请求
        api_requests.clear()

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 检查 API 请求
            print("\n=== API 请求汇总 ===")
            game_hands_requests = [r for r in api_requests if "game_hands" in r.get("url", "")]
            print(f"game_hands 请求: {len(game_hands_requests)}")
            for req in game_hands_requests:
                print(f"  {req}")

            # 检查页面状态
            print("\n=== 检查页面状态 ===")
            page_state = page.evaluate("""() => {
                // 尝试通过 DOM 获取信息
                const handArea = document.querySelector('[data-testid="room-hand"]')
                const cards = handArea ? handArea.querySelectorAll('[data-card-id]') : []

                return {
                    handAreaExists: !!handArea,
                    cardCount: cards.length,
                    bodyText: document.body.textContent.substring(0, 200)
                }
            }""")

            print(f"页面状态: {page_state}")

            # 尝试直接调用 store 方法
            print("\n=== 尝试获取游戏状态 ===")
            game_check = page.evaluate("""async () => {
                // 尝试找到 store
                const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]')
                if (!reactRoot) return { error: 'No React root found' }

                // 检查是否有游戏相关的文本
                const bodyText = document.body.textContent
                const hasGuandan = bodyText.includes('掼蛋')
                const hasStartGame = bodyText.includes('开始游戏')

                return {
                    hasGuandan,
                    hasStartGame,
                    bodyTextLength: bodyText.length
                }
            }""")

            print(f"游戏检查: {game_check}")

        print("\n=== 完整 API 请求列表 ===")
        for i, req in enumerate(api_requests[:30]):
            print(f"{i+1}. {req}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

def enumerate(lst):
    return list(zip(range(len(lst)), lst))

test_store_state()
