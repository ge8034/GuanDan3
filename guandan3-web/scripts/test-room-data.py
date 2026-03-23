"""
检查房间数据加载
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_room_data():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context()
        page = context.new_page()

        errors = []

        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)
                print(f"[ERROR] {msg.text[:200]}")

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

        # 检查 store 状态
        print("\n=== 检查 Store 状态 ===")
        store_state = page.evaluate("""() => {
            const roomStore = window.roomStore?.getState?.()
            const gameStore = window.gameStore?.getState?.()

            if (!roomStore || !gameStore) {
                return { error: 'Store not available' }
            }

            const members = (roomStore.members || []).map(m => ({
                seatNo: m.seat_no,
                uid: m.uid ? m.uid.substring(0, 8) + '...' : null,
                memberType: m.member_type,
                ready: m.ready
            }))

            return {
                room: {
                    currentRoomId: roomStore.currentRoom?.id || null,
                    currentRoomStatus: roomStore.currentRoom?.status || null,
                    membersCount: roomStore.members?.length || 0,
                    members: members
                },
                game: {
                    gameId: gameStore.gameId,
                    status: gameStore.status,
                    handSize: gameStore.myHand?.length || 0
                }
            }
        }""")

        print(f"Store 状态:\n{json.dumps(store_state, indent=2, ensure_ascii=False)}")

        # 检查页面元素
        print("\n=== 检查页面元素 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        print(f"开始游戏按钮存在: {start_btn.count() > 0}")

        if start_btn.count() > 0:
            print("\n=== 点击开始游戏 ===")
            start_btn.first.click()
            page.wait_for_timeout(8000)

            # 检查 store 状态（开始后）
            print("\n=== 检查 Store 状态（开始后） ===")
            store_state_after = page.evaluate("""() => {
                const roomStore = window.roomStore?.getState?.()
                const gameStore = window.gameStore?.getState?.()

                return {
                    room: {
                        currentRoomId: roomStore.currentRoom?.id || null,
                        currentRoomStatus: roomStore.currentRoom?.status || null,
                        membersCount: roomStore.members?.length || 0
                    },
                    game: {
                        gameId: gameStore.gameId,
                        status: gameStore.status,
                        handSize: gameStore.myHand?.length || 0,
                        handSample: gameStore.myHand?.slice(0, 2) || [],
                        turnNo: gameStore.turnNo,
                        currentSeat: gameStore.currentSeat
                    }
                }
            }""")

            print(f"Store 状态（开始后）:\n{json.dumps(store_state_after, indent=2, ensure_ascii=False)}")

            # 检查手牌区域
            print("\n=== 检查手牌区域 ===")
            hand_area = page.locator('[data-testid="room-hand"]')
            print(f"手牌区域可见: {hand_area.count() > 0}")
            if hand_area.count() > 0:
                is_visible = hand_area.is_visible()
                print(f"手牌区域在视口中可见: {is_visible}")

        print("\n=== 控制台错误 ===")
        print(f"错误数量: {len(errors)}")
        for i, err in enumerate(errors[:10]):
            print(f"{i+1}. {err[:200]}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_room_data()
