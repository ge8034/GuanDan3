"""
详细诊断游戏初始化问题
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_diagnose():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        page = context.new_page()

        # 收集所有控制台消息
        all_messages = []
        api_logs = []

        def on_console(msg):
            msg_text = msg.text
            all_messages.append({"type": msg.type, "text": msg_text})

        def on_request(request):
            if "supabase" in request.url:
                api_logs.append({"type": "request", "url": request.url, "method": request.method})

        def on_response(response):
            if "supabase" in response.url:
                api_logs.append({
                    "type": "response",
                    "url": response.url[:80],
                    "status": response.status,
                    "ok": response.ok
                })

        page.on("console", on_console)
        page.on("request", on_request)
        page.on("response", on_response)

        print("=== 访问首页 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(2)

        print("=== 点击开始练习 ===")
        practice_btn = page.locator('[data-testid="home-practice"]')
        practice_btn.click()
        time.sleep(8)

        # 获取房间ID
        current_url = page.url
        print(f"当前URL: {current_url}")
        if "/room/" in current_url:
            room_id = current_url.split('/room/')[-1].split('?')[0].split('/')[0]
            print(f"房间ID: {room_id}")
        else:
            print("未进入房间页面")
            browser.close()
            return

        # 等待页面加载
        time.sleep(3)

        # 检查 store 状态
        print("\n=== 检查 Store 状态 ===")
        store_state = page.evaluate("""() => {
            const roomStore = window.roomStore?.getState?.()
            const gameStore = window.gameStore?.getState?.()

            return {
                room: {
                    currentRoom: roomStore?.currentRoom?.id || null,
                    membersCount: roomStore?.members?.length || 0,
                    members: roomStore?.members?.map(m => ({
                        seatNo: m.seat_no,
                        uid: m.uid?.substring(0, 8) + '...' if m.uid else null,
                        memberType: m.member_type,
                        ready: m.ready
                    }))
                },
                game: {
                    gameId: gameStore?.gameId,
                    status: gameStore?.status,
                    handSize: gameStore?.myHand?.length || 0,
                    turnNo: gameStore?.turnNo,
                    currentSeat: gameStore?.currentSeat
                }
            }
        }""")

        print(f"Store 状态: {json.dumps(store_state, indent=2, ensure_ascii=False)}")

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("已点击开始游戏按钮")
            time.sleep(8)

            # 检查 store 状态（开始后）
            print("\n=== 检查 Store 状态（开始后） ===")
            store_state_after = page.evaluate("""() => {
                const roomStore = window.roomStore?.getState?.()
                const gameStore = window.gameStore?.getState?.()

                return {
                    room: {
                        currentRoom: roomStore?.currentRoom?.id || null,
                        membersCount: roomStore?.members?.length || 0,
                        roomStatus: roomStore?.currentRoom?.status
                    },
                    game: {
                        gameId: gameStore?.gameId,
                        status: gameStore?.status,
                        handSize: gameStore?.myHand?.length || 0,
                        handSample: gameStore?.myHand?.slice(0, 2) || [],
                        turnNo: gameStore?.turnNo,
                        currentSeat: gameStore?.currentSeat
                    }
                }
            }""")

            print(f"Store 状态（开始后）: {json.dumps(store_state_after, indent=2, ensure_ascii=False)}")
        else:
            print("未找到开始游戏按钮")

        # 检查 API 日志
        print("\n=== API 调用汇总 ===")
        start_game_calls = [log for log in api_logs if "start_game" in log.get("url", "")]
        print(f"start_game 调用: {len(start_game_calls)}")
        for log in start_game_calls:
            print(f"  {log}")

        game_hands_calls = [log for log in api_logs if "game_hands" in log.get("url", "")]
        print(f"\ngame_hands 调用: {len(game_hands_calls)}")
        for log in game_hands_calls:
            print(f"  {log}")

        # 检查控制台错误
        print("\n=== 控制台错误 ===")
        errors = [m for m in all_messages if m["type"] == "error"]
        print(f"错误数量: {len(errors)}")
        for i, err in enumerate(errors[:10]):
            print(f"{i+1}. {err['text'][:200]}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_diagnose()
