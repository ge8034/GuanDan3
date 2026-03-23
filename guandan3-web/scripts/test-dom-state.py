"""
通过检查 DOM 状态来诊断问题
"""
from playwright.sync_api import sync_playwright
import time

def test_dom_state():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        errors = []
        warnings = []

        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)
                print(f"[ERROR] {msg.text[:200]}")
            elif msg.type == "warning":
                warnings.append(msg.text)
                print(f"[WARN] {msg.text[:200]}")

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

        # 检查页面元素
        print("\n=== 检查页面元素（开始游戏前） ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        print(f"开始游戏按钮存在: {start_btn.count() > 0}")
        if start_btn.count() > 0:
            print(f"开始游戏按钮可见: {start_btn.is_visible()}")

        # 检查手牌区域
        hand_area = page.locator('[data-testid="room-hand"]')
        print(f"手牌区域存在: {hand_area.count() > 0}")
        if hand_area.count() > 0:
            print(f"手牌区域可见: {hand_area.is_visible()}")
            # 检查是否有卡牌元素
            card_elements = hand_area.locator('[data-card-id]').count()
            print(f"手牌区域卡牌数量: {card_elements}")

        # 检查玩家头像
        print("\n=== 检查玩家头像 ===")
        for i in range(4):
            avatar = page.locator(f'[data-testid="player-avatar-{i}"]')
            print(f"位置 {i} 头像存在: {avatar.count() > 0}, 可见: {avatar.is_visible() if avatar.count() > 0 else 'N/A'}")

        # 检查游戏状态文本
        print("\n=== 检查游戏状态 ===")
        page_text = page.text_content('body')
        print(f"页面是否包含'掼蛋': {'掼蛋' in page_text if page_text else 'N/A'}")
        print(f"页面是否包含'开始游戏': {'开始游戏' in page_text if page_text else 'N/A'}")

        # 点击开始游戏
        if start_btn.count() > 0:
            print("\n=== 点击开始游戏 ===")
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 检查页面元素（开始游戏后）
            print("\n=== 检查页面元素（开始游戏后） ===")
            start_btn_after = page.locator('button:has-text("开始游戏")')
            print(f"开始游戏按钮仍存在: {start_btn_after.count() > 0}")

            # 检查手牌区域
            hand_area_after = page.locator('[data-testid="room-hand"]')
            print(f"手牌区域存在: {hand_area_after.count() > 0}")
            if hand_area_after.count() > 0:
                print(f"手牌区域可见: {hand_area_after.is_visible()}")
                card_elements_after = hand_area_after.locator('[data-card-id]').count()
                print(f"手牌区域卡牌数量: {card_elements_after}")

                # 如果有卡牌，检查第一张牌的数据
                if card_elements_after > 0:
                    first_card = hand_area_after.locator('[data-card-id]').first
                    card_id = first_card.get_attribute('data-card-id')
                    print(f"第一张牌ID: {card_id}")

        print("\n=== 控制台消息汇总 ===")
        print(f"错误: {len(errors)}")
        print(f"警告: {len(warnings)}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_dom_state()
