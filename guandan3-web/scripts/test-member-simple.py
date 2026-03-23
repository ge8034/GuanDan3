#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版成员同步测试 - 从首页开始
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
    """从首页开始测试成员同步"""
    console_messages = []
    console_errors = []

    print("=" * 60)
    print("成员同步问题诊断（简化版）")
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
                print(f"[ERROR] {msg_text}")
            elif '[useRoomGameDerived]' in msg_text or '[fetchRoom]' in msg_text:
                print(f"[DEBUG] {msg_text}")

        page.on("console", on_console)

        # 1. 访问首页
        print("\n步骤 1: 访问首页")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(3)
        print(f"当前 URL: {page.url}")

        # 2. 查找并点击开始练习按钮
        print("\n步骤 2: 查找并点击 '开始练习' 按钮")
        buttons = page.query_selector_all('button')
        print(f"页面上共有 {len(buttons)} 个按钮")

        # 打印所有按钮的文本
        for i, btn in enumerate(buttons):
            text = btn.inner_text()
            if '练习' in text or '开始' in text:
                print(f"  按钮 {i}: '{text}'")

        # 查找包含"练习"文字的按钮
        practice_btn = None
        for btn in buttons:
            text = btn.inner_text()
            if '练习' in text:
                practice_btn = btn
                break

        if practice_btn:
            print("找到 '开始练习' 按钮")
            practice_btn.click()
            print("等待页面导航...")
            time.sleep(8)

            # 检查URL是否变化
            new_url = page.url
            print(f"当前 URL: {new_url}")

            # 如果URL包含/room/，说明导航成功
            if '/room/' in new_url:
                print("✓ 成功导航到房间页面")

                # 3. 等待游戏初始化
                print("\n步骤 3: 等待游戏初始化...")
                time.sleep(10)

                # 4. 检查调试日志
                print("\n步骤 4: 检查调试日志中的成员信息")
                debug_logs = [msg for msg in console_messages if '[useRoomGameDerived]' in msg['text'] or '[fetchRoom]' in msg['text']]

                if debug_logs:
                    print("调试日志:")
                    for log in debug_logs:
                        print(f"  {log['text']}")

                    # 检查是否有mySeat: unknown
                    for log in debug_logs:
                        if 'mySeat: unknown' in log['text'] or '"myMember":null' in log['text']:
                            print("\n⚠️ 发现问题: myMember为null - 成员识别失败!")
                            break
                        elif 'mySeat: 0' in log['text']:
                            print("\n✓ mySeat正确显示为0")
                            break
                else:
                    print("没有找到调试日志")

                # 5. 检查手牌
                print("\n步骤 5: 检查手牌")
                hand_element = page.query_selector('[data-testid="room-cards"]')
                if hand_element:
                    cards = hand_element.query_selector_all('[data-card-id]')
                    print(f"✓ 手牌数量: {len(cards)}")
                else:
                    print("无法找到手牌容器")

            else:
                print("✗ 导航失败，URL中没有/room/")
        else:
            print("✗ 无法找到 '开始练习' 按钮")

        # 6. 汇总结果
        print("\n" + "=" * 60)
        print("诊断结果")
        print("=" * 60)
        print(f"控制台消息总数: {len(console_messages)}")
        print(f"控制台错误: {len(console_errors)}")

        if console_errors:
            print("\n--- 控制台错误详情 ---")
            for i, err in enumerate(console_errors[:10], 1):
                print(f"{i}. {err['text']}")

        # 保存诊断数据
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "final_url": page.url,
            "console_messages": console_messages,
            "console_errors": console_errors,
            "debug_logs": [msg for msg in console_messages if '[useRoomGameDerived]' in msg['text'] or '[fetchRoom]' in msg['text']],
        }

        log_file = "test-results/member-sync-simple.json"
        os.makedirs("test-results", exist_ok=True)
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        print(f"\n详细诊断数据已保存到: {log_file}")

        browser.close()

        return {
            "console_errors": len(console_errors),
            "success": len(console_errors) == 0
        }

if __name__ == "__main__":
    result = test_member_sync()
    exit(0 if result["success"] else 1)
