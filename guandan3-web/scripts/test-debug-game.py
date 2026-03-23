"""
调试游戏初始化问题
"""
from playwright.sync_api import sync_playwright
import time

def test_game_debug():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        all_messages = []
        api_calls = []

        def on_console(msg):
            msg_text = msg.text
            all_messages.append({"type": msg.type, "text": msg_text})
            if msg.type in ["error", "warning"]:
                print(f"[CONSOLE {msg.type.upper()}] {msg_text[:300]}")

            # 记录API调用
            if "supabase" in msg_text.lower() or "rpc" in msg_text.lower():
                api_calls.append(msg_text)

        def on_response(response):
            if "supabase" in response.url:
                status = response.status
                print(f"[API {status}] {response.url[:100]}")

        page.on("console", on_console)
        page.on("response", on_response)

        print("=== 访问首页 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)

        print("\n=== 点击开始练习 ===")
        practice_btn = page.locator('[data-testid="home-practice"]')
        practice_btn.click()
        time.sleep(5)

        room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
        print(f"房间ID: {room_id}")

        # 检查房间状态
        print("\n=== 检查房间状态 ===")
        room_state = page.evaluate("""() => {
            const store = window.roomStore?.getState?.()
            return {
                currentRoom: store?.currentRoom,
                membersCount: store?.members?.length || 0,
                members: store?.members?.map(m => ({
                    uid: m.uid,
                    seatNo: m.seat_no,
                    ready: m.ready,
                    memberType: m.member_type
                }))
            }
        }""")
        print(f"房间状态: {room_state}")

        # 检查游戏状态
        print("\n=== 检查游戏状态（点击开始前） ===")
        game_state_before = page.evaluate("""() => {
            const store = window.gameStore?.getState?.()
            return {
                gameId: store?.gameId,
                status: store?.status,
                handSize: store?.myHand?.length || 0
            }
        }""")
        print(f"游戏状态（开始前）: {game_state_before}")

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("已点击开始游戏，等待响应...")
            time.sleep(6)

            # 检查游戏状态（开始后）
            print("\n=== 检查游戏状态（点击后） ===")
            game_state_after = page.evaluate("""() => {
                const store = window.gameStore?.getState?.()
                return {
                    gameId: store?.gameId,
                    status: store?.status,
                    handSize: store?.myHand?.length || 0,
                    hand: store?.myHand?.slice(0, 2) || [],
                    turnNo: store?.turnNo,
                    currentSeat: store?.currentSeat
                }
            }""")
            print(f"游戏状态（开始后）: {game_state_after}")
        else:
            print("未找到开始游戏按钮")

        # 检查控制台错误
        print("\n=== 控制台消息汇总 ===")
        error_count = sum(1 for m in all_messages if m["type"] == "error")
        warning_count = sum(1 for m in all_messages if m["type"] == "warning")
        print(f"总消息: {len(all_messages)}")
        print(f"错误: {error_count}")
        print(f"警告: {warning_count}")

        if error_count > 0:
            print("\n=== 所有错误 ===")
            for i, m in enumerate(all_messages):
                if m["type"] == "error":
                    print(f"{i+1}. {m['text'][:200]}")

        # 手动检查游戏数据
        print("\n=== 手动检查游戏数据 ===")
        manual_check = page.evaluate("""async () => {
            const { supabase } = window
            if (!supabase) return { error: 'Supabase not available' }

            try {
                // 获取当前用户
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return { error: 'No user logged in' }

                // 获取用户的房间成员记录
                const { data: members, error: memberError } = await supabase
                    .from('room_members')
                    .select('*')
                    .eq('uid', user.id)

                // 获取游戏
                const { data: games } = await supabase
                    .from('games')
                    .select('*')
                    .limit(1)

                return {
                    userId: user.id,
                    members: members?.length || 0,
                    memberData: members,
                    games: games?.length || 0,
                    gameData: games,
                    memberError: memberError?.message
                }
            } catch (e) {
                return { error: e.message }
            }
        }""")

        print(f"手动检查结果: {manual_check}")

        print("\n=== 按Enter关闭浏览器 ===")
        input()
        browser.close()

test_game_debug()
