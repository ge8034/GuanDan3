"""
测试游戏手牌查询问题
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_hand_query():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()

        all_messages = []

        def on_console(msg):
            msg_text = msg.text
            all_messages.append({
                "type": msg.type,
                "text": msg_text
            })
            if msg.type in ["error", "warning"]:
                print(f"[{msg.type.upper()}] {msg_text[:200]}")

        page.on("console", on_console)

        print("访问首页...")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(2)

        print("点击开始练习...")
        try:
            practice_btn = page.locator('[data-testid="home-practice"]')
            practice_btn.click(timeout=5000)
            time.sleep(8)

            # 获取当前房间ID
            room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
            print(f"房间ID: {room_id}")

            # 点击开始游戏
            print("点击开始游戏按钮...")
            start_btn = page.locator('button:has-text("开始游戏")')
            if start_btn.count() > 0:
                start_btn.first.click(timeout=5000)
                time.sleep(5)

            # 检查游戏状态
            game_state = page.evaluate("""() => {
                const hand = window.gameStore?.getState?.()?.myHand
                return {
                    handSize: hand?.length || 0,
                    hand: hand?.slice(0, 3) || [], // 前3张牌
                    gameId: window.gameStore?.getState?.()?.gameId,
                    status: window.gameStore?.getState?.()?.status
                }
            }""")

            print(f"\n游戏状态: {json.dumps(game_state, indent=2, ensure_ascii=False)}")

        except Exception as e:
            print(f"错误: {e}")
            import traceback
            traceback.print_exc()

        print("\n=== 控制台错误汇总 ===")
        error_count = sum(1 for m in all_messages if m["type"] == "error")
        print(f"总错误: {error_count}")

        if error_count > 0:
            print("\n所有错误:")
            for m in all_messages:
                if m["type"] == "error":
                    print(f"  {m['text']}")

        input("\n按Enter关闭浏览器...")
        browser.close()

if __name__ == "__main__":
    test_hand_query()
