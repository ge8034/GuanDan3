"""
测试 fetchGame 函数
"""
from playwright.sync_api import sync_playwright
import time

def test_fetch_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        errors = []

        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)
                print(f"[ERROR] {msg.text[:200]}")
            elif "fetch" in msg.text.lower() or "game" in msg.text.lower():
                print(f"[LOG] {msg.text[:150]}")

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
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 手动调用 fetchGame 并检查结果
            print("\n=== 手动调用 fetchGame ===")
            fetch_result = page.evaluate("""async () => {
                // 获取 Supabase 客户端
                const supabase = window.supabase
                if (!supabase) return { error: 'Supabase not available' }

                try {
                    // 获取当前用户
                    const { data: { user } } = await supabase.auth.getUser()
                    if (!user) return { error: 'No user logged in' }

                    // 获取游戏
                    const { data: games, error: gameError } = await supabase
                        .from('games')
                        .select('*')
                        .limit(1)

                    if (gameError) {
                        return { error: 'Game query failed: ' + gameError.message }
                    }

                    if (!games || games.length === 0) {
                        return { error: 'No games found' }
                    }

                    const game = games[0]
                    console.log('Found game:', game.id)

                    // 获取手牌
                    const { data: hands, error: handsError } = await supabase
                        .from('game_hands')
                        .select('*')
                        .eq('game_id', game.id)

                    if (handsError) {
                        return {
                            error: 'Hands query failed: ' + handsError.message,
                            details: handsError
                        }
                    }

                    return {
                        success: true,
                        game: { id: game.id, status: game.status },
                        handsCount: hands?.length || 0,
                        hands: hands?.map(h => ({
                            gameId: h.game_id,
                            seatNo: h.seat_no,
                            handSize: h.hand?.length || 0
                        }))
                    }
                } catch (e) {
                    return { error: e.message, stack: e.stack }
                }
            }""")

            print(f"fetchGame 结果: {fetch_result}")

        print("\n=== 按Enter关闭浏览器 ===")
        input()
        browser.close()

test_fetch_game()
