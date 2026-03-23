#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接测试成员同步问题 - 使用RPC创建房间后导航
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

# Supabase配置
SUPABASE_URL = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://rzzywltxlfgucngfiznx.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM')

def create_practice_room_via_rpc(supabase_url, anon_key):
    """通过RPC创建练习房间"""
    import urllib.request
    import json

    endpoint = f"{supabase_url}/rest/v1/rpc/create_practice_room"
    headers = {
        'apikey': anon_key,
        'Authorization': f'Bearer {anon_key}',
        'Content-Type': 'application/json'
    }

    req = urllib.request.Request(endpoint, json.dumps({}).encode(), headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
            # 返回格式可能是 [{room_id: ...}] 或 {room_id: ...}
            if isinstance(data, list) and len(data) > 0:
                return data[0].get('room_id')
            elif isinstance(data, dict):
                return data.get('room_id')
            return None
    except Exception as e:
        print(f"创建房间失败: {e}")
        return None

def test_member_sync_direct():
    """直接导航到房间并测试成员同步"""
    issues = []
    console_messages = []
    console_errors = []

    print("=" * 60)
    print("成员同步问题直接诊断")
    print("=" * 60)

    # 1. 创建练习房间
    print("\n步骤 1: 创建练习房间")
    room_id = create_practice_room_via_rpc(SUPABASE_URL, SUPABASE_ANON_KEY)
    if not room_id:
        print("无法创建房间，尝试使用测试房间ID")
        room_id = "test-room-id"
    else:
        print(f"✓ 创建房间成功: {room_id}")

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
            elif msg_type == "warning":
                print(f"[WARN] {msg_text}")
            elif '[useRoomGameDerived]' in msg_text or '[fetchRoom]' in msg_text:
                print(f"[DEBUG] {msg_text}")

        page.on("console", on_console)

        # 2. 直接导航到房间页面
        print(f"\n步骤 2: 导航到房间页面 /room/{room_id}")
        page.goto(f"http://localhost:3000/room/{room_id}", wait_until="networkidle", timeout=60000)
        time.sleep(5)

        # 3. 检查当前URL
        current_url = page.url
        print(f"当前 URL: {current_url}")

        # 4. 等待页面完全加载
        print("\n步骤 3: 等待游戏初始化...")
        time.sleep(10)

        # 5. 检查手牌
        print("\n步骤 4: 检查手牌状态")
        hand_element = page.query_selector('[data-testid="room-cards"]')
        if hand_element:
            cards = hand_element.query_selector_all('[data-card-id]')
            print(f"✓ 手牌数量: {len(cards)}")
            if len(cards) > 0:
                print("✓ 游戏已成功初始化")
            else:
                issues.append("手牌为空")
        else:
            issues.append("无法找到手牌容器")

        # 6. 点击调试按钮查看调试信息
        print("\n步骤 5: 检查调试面板")
        debug_button = page.query_selector("text=调试")
        if debug_button:
            debug_button.click()
            time.sleep(2)

            # 查找调试面板
            ai_panel = page.query_selector(".fixed.bottom-20.left-4")
            if ai_panel:
                panel_text = ai_panel.inner_text()
                print("调试面板内容:")
                print(panel_text[:500])  # 只打印前500个字符

                # 检查是否有 "mySeat: unknown" 的日志
                if "mySeat: unknown" in panel_text or "mySeat: ?" in panel_text:
                    issues.append("mySeat显示为unknown - 成员识别失败")
                elif "mySeat: 0" in panel_text:
                    print("✓ mySeat正确显示为0")
            else:
                # 尝试其他可能的调试面板选择器
                perf_panel = page.query_selector(".fixed.bottom-20.left-20")
                if perf_panel:
                    panel_text = perf_panel.inner_text()
                    print("性能监控面板:")
                    print(panel_text)

        # 7. 汇总结果
        print("\n" + "=" * 60)
        print("诊断结果")
        print("=" * 60)
        print(f"控制台消息总数: {len(console_messages)}")
        print(f"控制台错误: {len(console_errors)}")
        print(f"发现问题: {len(issues)}")

        if console_errors:
            print("\n--- 控制台错误详情 ---")
            for i, err in enumerate(console_errors[:10], 1):
                print(f"{i}. {err['text']}")

        if issues:
            print("\n--- 发现的问题 ---")
            for i, issue in enumerate(issues, 1):
                print(f"{i}. {issue}")

        # 保存诊断数据
        log_data = {
            "timestamp": datetime.now().isoformat(),
            "room_id": room_id,
            "console_messages": console_messages,
            "console_errors": console_errors,
            "issues": issues,
            "summary": {
                "total_console_messages": len(console_messages),
                "total_console_errors": len(console_errors),
                "total_issues": len(issues)
            }
        }

        log_file = "test-results/member-sync-direct.json"
        os.makedirs("test-results", exist_ok=True)
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(log_data, f, indent=2, ensure_ascii=False)

        print(f"\n详细诊断数据已保存到: {log_file}")

        browser.close()

        return {
            "console_errors": len(console_errors),
            "issues": len(issues),
            "success": len(console_errors) == 0 and len(issues) == 0
        }

if __name__ == "__main__":
    result = test_member_sync_direct()
    exit(0 if result["success"] else 1)
