#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接在控制台测试成员同步问题
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
    """直接在控制台测试成员同步"""
    console_messages = []
    console_errors = []

    print("=" * 60)
    print("成员同步问题控制台诊断")
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
            elif 'member' in msg_text.lower() or 'auth' in msg_text.lower() or 'room' in msg_text.lower():
                print(f"[LOG] {msg_text}")

        page.on("console", on_console)

        # 1. 访问首页
        print("\n步骤 1: 访问首页")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        time.sleep(3)

        # 2. 通过控制台检查认证状态
        print("\n步骤 2: 检查认证状态")
        auth_check = page.evaluate("""async () => {
            // 尝试获取 Supabase 客户端
            const supabaseModule = await import('/src/lib/supabase/client.js');
            const supabase = supabaseModule.supabase;

            // 获取当前会话
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            return {
                hasSupabase: !!supabase,
                hasSession: !!sessionData?.session,
                userId: sessionData?.session?.user?.id || null,
                sessionError: sessionError?.message || null
            };
        }""")

        print(f"认证状态: {json.dumps(auth_check, indent=2, ensure_ascii=False)}")

        if not auth_check.get('userId'):
            print("⚠️ 未登录，尝试匿名登录...")
            login_result = page.evaluate("""async () => {
                const supabaseModule = await import('/src/lib/supabase/client.js');
                const supabase = supabaseModule.supabase;

                const { data, error } = await supabase.auth.signInAnonymously();

                return {
                    success: !!data?.user,
                    userId: data?.user?.id || null,
                    error: error?.message || null
                };
            }""")

            print(f"登录结果: {json.dumps(login_result, indent=2, ensure_ascii=False)}")
            auth_check['userId'] = login_result.get('userId')

        # 3. 创建练习房间
        if auth_check.get('userId'):
            print("\n步骤 3: 创建练习房间")
            create_room_result = page.evaluate("""async () => {
                const supabaseModule = await import('/src/lib/supabase/client.js');
                const supabase = supabaseModule.supabase;

                const { data, error } = await supabase.rpc('create_practice_room', {
                    p_visibility: 'private'
                });

                return {
                    success: !error,
                    data: data,
                    error: error?.message || null,
                    roomId: data?.[0]?.room_id || null
                };
            }""")

            print(f"创建房间结果: {json.dumps(create_room_result, indent=2, ensure_ascii=False)}")

            room_id = create_room_result.get('roomId')
            if room_id:
                # 4. 导航到房间页面
                print(f"\n步骤 4: 导航到房间 /room/{room_id}")
                page.goto(f"http://localhost:3000/room/{room_id}", wait_until="networkidle", timeout=60000)
                time.sleep(5)

                # 5. 等待游戏初始化
                print("\n步骤 5: 等待游戏初始化...")
                time.sleep(10)

                # 6. 检查成员数据
                print("\n步骤 6: 检查成员数据")
                member_check = page.evaluate("""async () => {
                    // 检查store状态
                    const authStoreModule = await import('/src/lib/store/auth.js');
                    const roomStoreModule = await import('/src/lib/store/room.js');

                    // 尝试获取store数据
                    const getUserId = () => {
                        try {
                            const { useAuthStore } = authStoreModule;
                            return useAuthStore.getState().user?.id || null;
                        } catch(e) {
                            return null;
                        }
                    };

                    const getMembers = () => {
                        try {
                            const { useRoomStore } = roomStoreModule;
                            return useRoomStore.getState().members || [];
                        } catch(e) {
                            return [];
                        }
                    };

                    const userId = getUserId();
                    const members = getMembers();

                    // 查找匹配的成员
                    const myMember = members.find(m => m.uid === userId);

                    return {
                        userId: userId,
                        membersCount: members.length,
                        members: members.map(m => ({ seat: m.seat_no, uid: m.uid, type: m.member_type })),
                        myMember: myMember ? { seat: myMember.seat_no, uid: myMember.uid, type: myMember.member_type } : null,
                        foundMatch: !!myMember
                    };
                }""")

                print(f"成员数据检查: {json.dumps(member_check, indent=2, ensure_ascii=False)}")

                if not member_check.get('foundMatch'):
                    print("\n⚠️ 关键问题: userId在members中找不到匹配!")
                    print(f"  userId: {member_check.get('userId')}")
                    print(f"  members中的uid列表: {[m['uid'] for m in member_check.get('members', [])]}")
                else:
                    print("\n✓ 成员匹配成功!")

                # 7. 检查手牌
                print("\n步骤 7: 检查手牌")
                hand_element = page.query_selector('[data-testid="room-cards"]')
                if hand_element:
                    cards = hand_element.query_selector_all('[data-card-id]')
                    print(f"✓ 手牌数量: {len(cards)}")
                else:
                    print("无法找到手牌容器")

        # 8. 汇总结果
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
            "auth_check": auth_check,
            "create_room_result": create_room_result if 'create_room_result' in locals() else None,
            "member_check": member_check if 'member_check' in locals() else None,
            "console_messages": console_messages,
            "console_errors": console_errors,
        }

        log_file = "test-results/member-sync-direct.json"
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
