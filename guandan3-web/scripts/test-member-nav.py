#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版测试 - 直接点击并检查控制台
"""
import sys
import io
from playwright.sync_api import sync_playwright
import json
import time
import os
from datetime import datetime

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def test_member_sync():
    """直接点击并检查控制台"""
    console_messages = []
    console_errors = []
    debug_logs = []

    print("=" * 60)
    print("成员同步问题测试")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 捕获控制台消息
        def on_console(msg):
            msg_type = msg.type
            msg_text = msg.text
            entry = {"type": msg_type, "text": msg_text, "time": datetime.now().isoformat()}
            console_messages.append(entry)
            if msg_type == "error":
                console_errors.append(entry)
            if '[useRoomGameDerived]' in msg_text or '[fetchRoom]' in msg_text or 'myMember' in msg_text or 'mySeat' in msg_text:
                debug_logs.append(entry)
                print(f"[DEBUG] {msg_text}")
            if msg_type == "error":
                print(f"[ERROR] {msg_text}")

        page.on("console", on_console)

        # 1. 访问首页
        print("\n步骤 1: 访问首页")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(3)
        print(f"当前 URL: {page.url}")

        # 2. 查找并点击开始练习按钮
        print("\n步骤 2: 查找并点击 '开始练习' 按钮")

        # 尝试多种方式找到按钮
        practice_btn = page.query_selector('[data-testid="home-practice"]')
        if not practice_btn:
            practice_btn = page.query_selector('text="开始练习"')

        if practice_btn:
            print("✓ 找到按钮，点击中...")
            # 先等待按钮可点击
            practice_btn.wait_for_element_state('stable', timeout=5000)

            # 使用JavaScript点击以避免元素遮挡问题
            page.evaluate("(el) => el.click()", practice_btn)
            print("等待页面导航...")

            # 等待URL变化
            for i in range(20):  # 等待最多20秒
                time.sleep(1)
                current_url = page.url
                if '/room/' in current_url:
                    print(f"✓ 成功导航到房间页面: {current_url}")
                    break
                if i % 5 == 0:
                    print(f"  等待中... ({i}s) 当前URL: {current_url}")
            else:
                print(f"✗ 导航超时，最终URL: {page.url}")
                # 即使URL没变，也继续检查

            # 3. 等待页面加载和游戏初始化
            print("\n步骤 3: 等待页面加载和游戏初始化...")
            time.sleep(15)

            # 4. 检查调试日志
            print("\n步骤 4: 分析调试日志")
            if debug_logs:
                print(f"找到 {len(debug_logs)} 条调试日志:")
                for log in debug_logs:
                    print(f"  {log['text']}")

                # 分析问题
                has_my_seat_unknown = any('mySeat: unknown' in log['text'] or 'mySeat:?' in log['text'] for log in debug_logs)
                has_my_seat_zero = any('mySeat: 0' in log['text'] for log in debug_logs)
                has_my_member_null = any('"myMember":null' in log['text'] or 'myMember: null' in log['text'] for log in debug_logs)
                has_my_member_object = any('myMember: Object' in log['text'] for log in debug_logs)
                has_members_data = any('[fetchRoom]' in log['text'] and 'members:' in log['text'] for log in debug_logs)

                print("\n诊断结果:")
                if has_my_member_null:
                    print("  ⚠️ myMember为null - 无法找到匹配的成员!")
                if has_my_member_object:
                    print("  ✓ myMember是Object - 成员被正确找到!")
                if has_my_seat_unknown:
                    print("  ⚠️ mySeat显示为unknown!")
                if has_my_seat_zero:
                    print("  ✓ mySeat正确显示为0")
                if has_members_data:
                    print("  ✓ fetchRoom获取了成员数据")

                # 打印成员数据
                for log in debug_logs:
                    if '[fetchRoom]' in log['text']:
                        print(f"\n成员数据: {log['text']}")
            else:
                print("没有找到调试日志 - 可能是游戏未初始化或isDev()返回false")

            # 5. 检查手牌
            print("\n步骤 5: 检查手牌状态")
            hand_element = page.query_selector('[data-testid="room-cards"]')
            if hand_element:
                cards = hand_element.query_selector_all('[data-card-id]')
                print(f"✓ 找到手牌容器，手牌数量: {len(cards)}")

                if len(cards) > 0:
                    print("✓ 游戏已成功初始化并分发手牌")
                else:
                    print("⚠️ 手牌容器存在但没有牌")
            else:
                print("✗ 无法找到手牌容器")

            # 6. 检查出牌按钮状态
            print("\n步骤 6: 检查出牌按钮状态")
            play_button = page.query_selector('[data-testid="room-play"]')
            if play_button:
                is_disabled = play_button.get_attribute('disabled') is not None
                print(f"出牌按钮: {'禁用' if is_disabled else '可用'}")
                if is_disabled and has_my_seat_zero:
                    print("  ⚠️ mySeat=0但出牌按钮禁用 - 可能是isMyTurn判断错误")
            else:
                print("无法找到出牌按钮")

        else:
            print("✗ 无法找到 '开始练习' 按钮")

        # 7. 汇总结果
        print("\n" + "=" * 60)
        print("最终结果")
        print("=" * 60)
        print(f"最终 URL: {page.url}")
        print(f"控制台消息总数: {len(console_messages)}")
        print(f"控制台错误: {len(console_errors)}")
        print(f"调试日志: {len(debug_logs)}")

        if console_errors:
            print("\n--- 控制台错误 ---")
            for err in console_errors[:10]:
                print(f"  {err['text']}")

        # 保存诊断数据
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "final_url": page.url,
            "console_messages": console_messages,
            "console_errors": console_errors,
            "debug_logs": debug_logs,
        }

        log_file = "test-results/member-sync-nav.json"
        os.makedirs("test-results", exist_ok=True)
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        print(f"\n详细数据已保存到: {log_file}")

        browser.close()

        return {
            "console_errors": len(console_errors),
            "url": page.url,
            "success": '/room/' in page.url and len(console_errors) == 0
        }

if __name__ == "__main__":
    result = test_member_sync()
    exit(0 if result["success"] else 1)
