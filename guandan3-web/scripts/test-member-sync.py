#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
成员同步问题诊断脚本
测试 auth.uid() 和前端 userId 是否匹配
"""
import sys
import io
from playwright.sync_api import sync_playwright
import json
import time
from datetime import datetime

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def test_member_sync():
    """诊断成员同步问题"""
    issues = []
    debug_info = {}

    print("=" * 60)
    print("成员同步问题诊断")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 捕获控制台消息
        console_messages = []
        def on_console(msg):
            entry = {"type": msg.type, "text": msg.text, "time": datetime.now().isoformat()}
            console_messages.append(entry)
            if msg.type == "error":
                print(f"[ERROR] {msg.text}")
            elif msg.type == "warning":
                print(f"[WARN] {msg.text}")

        page.on("console", on_console)

        # 1. 访问首页
        print("\n步骤 1: 访问首页")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(2)

        # 2. 点击开始练习
        print("\n步骤 2: 点击 '开始练习' 创建练习房间")
        home_practice = page.query_selector('[data-testid="home-practice"]')
        if home_practice:
            print("找到 '开始练习' 按钮，点击...")
            home_practice.click()
            print("等待页面导航...")
            time.sleep(10)  # 增加等待时间

            # 检查URL是否变化
            current_url = page.url
            print(f"当前 URL: {current_url}")

            # 如果还在首页，说明点击没生效
            if current_url.endswith('/') or current_url.endswith('/3000'):
                print("警告: 可能点击未生效，尝试使用JavaScript点击")
                page.evaluate("""() => {
                    const btn = document.querySelector('[data-testid="home-practice"]');
                    if (btn) btn.click();
                }""")
                time.sleep(10)
                current_url = page.url
                print(f"重试后 URL: {current_url}")

            # 3. 调试信息：检查认证状态
            print("\n步骤 3: 检查认证状态")
            auth_info = page.evaluate("""() => {
                // 尝试获取认证信息
                const info = {
                    // 检查是否有 localStorage 中的 auth 数据
                    hasAuthStorage: typeof localStorage !== 'undefined' && localStorage.getItem('auth-storage'),
                    // 尝试从 window 获取 Supabase 客户端
                    hasSupabase: typeof window !== 'undefined' && window.supabase,
                };
                return info;
            }""")

            debug_info['auth_info'] = auth_info
            print(f"认证信息: {json.dumps(auth_info, indent=2, ensure_ascii=False)}")

            # 4. 调试信息：检查房间状态
            print("\n步骤 4: 检查房间状态")
            room_info = page.evaluate("""() => {
                // 尝试从 React DevTools 或全局状态获取信息
                const info = {
                    url: window.location.href,
                    pathname: window.location.pathname,
                    search: window.location.search,
                    hash: window.location.hash,
                };
                return info;
            }""")

            debug_info['room_info'] = room_info
            print(f"房间信息: {json.dumps(room_info, indent=2, ensure_ascii=False)}")

            # 提取 roomId
            import re
            url_match = re.search(r'/room/([a-f0-9-]+)', room_info.get('pathname', ''))
            room_id = url_match.group(1) if url_match else None
            print(f"提取的 roomId: {room_id}")

            if room_id:
                debug_info['room_id'] = room_id

                # 5. 检查手牌状态（游戏是否开始）
                print("\n步骤 5: 检查手牌状态")
                hand_element = page.query_selector('[data-testid="room-cards"]')
                if hand_element:
                    cards = hand_element.query_selector_all('[data-card-id]')
                    print(f"✓ 手牌数量: {len(cards)}")
                    debug_info['hand_count'] = len(cards)

                    if len(cards) > 0:
                        card_ids = []
                        for card in cards[:5]:  # 只取前5张
                            card_id = card.get_attribute('data-card-id')
                            card_ids.append(card_id)
                        print(f"  前5张牌ID: {card_ids}")
                        debug_info['sample_card_ids'] = card_ids
                    else:
                        issues.append("手牌为空，游戏可能未正确初始化")
                else:
                    issues.append("无法找到手牌容器")

                # 6. 关键诊断：检查 DOM 中的调试面板
                print("\n步骤 6: 检查调试面板信息")
                # 点击调试按钮
                debug_button = page.query_selector("text=调试")
                if debug_button:
                    debug_button.click()
                    time.sleep(1)

                    # 查找调试面板
                    debug_panel = page.query_selector(".fixed.bottom-20.left-4")
                    if debug_panel:
                        print("✓ 找到调试面板")
                        panel_text = debug_panel.inner_text()
                        print(f"调试面板内容:\n{panel_text}")
                        debug_info['debug_panel_text'] = panel_text
                    else:
                        issues.append("无法找到调试面板")

                # 7. 检查是否有出牌按钮可用
                print("\n步骤 7: 检查出牌按钮状态")
                play_button = page.query_selector('[data-testid="room-play"]')
                if play_button:
                    is_disabled = play_button.get_attribute('disabled') is not None
                    print(f"出牌按钮状态: {'禁用' if is_disabled else '可用'}")
                    debug_info['play_button_disabled'] = is_disabled

                    if is_disabled:
                        issues.append("出牌按钮被禁用，可能是因为 isMyTurn = false")

        # 等待观察
        print("\n等待观察控制台输出...")
        time.sleep(3)

        # 8. 汇总结果
        print("\n" + "=" * 60)
        print("诊断结果")
        print("=" * 60)
        print(f"发现问题: {len(issues)}")

        if issues:
            print("\n--- 发现的问题 ---")
            for i, issue in enumerate(issues, 1):
                print(f"{i}. {issue}")

        # 保存诊断数据
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "debug_info": debug_info,
            "console_messages": console_messages,
            "issues": issues,
            "summary": {
                "total_issues": len(issues),
                "room_id": room_id,
                "hand_count": debug_info.get('hand_count', 0),
                "play_button_disabled": debug_info.get('play_button_disabled', None)
            }
        }

        log_file = "test-results/member-sync-diagnosis.json"
        import os
        os.makedirs("test-results", exist_ok=True)
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        print(f"\n详细诊断数据已保存到: {log_file}")

        browser.close()

        return {
            "issues": len(issues),
            "room_id": room_id,
            "hand_count": debug_info.get('hand_count', 0),
            "success": len(issues) == 0
        }

if __name__ == "__main__":
    result = test_member_sync()
    exit(0 if result["success"] else 1)
