"""
测试 games 表查询 - 修复版2
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_games_query():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        print("=== 访问首页并点击开始练习 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
        page.locator('[data-testid="home-practice"]').click()

        # 等待导航
        page.wait_for_url("**/room/**", timeout=10000)
        room_id = page.url.split('/room/')[-1].split('?')[0].split('/')[0]
        print(f"房间ID: {room_id}")

        # 等待页面加载
        page.wait_for_timeout(5000)

        # 点击开始游戏
        print("\n=== 点击开始游戏 ===")
        start_btn = page.locator('button:has-text("开始游戏")')
        if start_btn.count() > 0:
            start_btn.first.click()
            print("等待游戏初始化...")
            page.wait_for_timeout(10000)

            # 手动测试查询 - 使用 Python 模板字符串
            print("\n=== 手动测试 games 表查询 ===")
            js_code = f"""async () => {{
                try {{
                    const sessionStr = localStorage.getItem('sb-rzzywltxlfgucngfiznx-auth-token');
                    if (!sessionStr) return {{ error: 'No session found' }};

                    const session = JSON.parse(sessionStr);
                    const token = session[0]?.access_token || session.access_token;
                    if (!token) return {{ error: 'No access token' }};

                    const roomId = "{room_id}";

                    const supabaseUrl = 'https://rzzywltxlfgucngfiznx.supabase.co';
                    const params = new URLSearchParams({{
                        'room_id': `eq.${{roomId}}`,
                        'status': 'in.(playing,paused,finished)',
                        'limit': '1'
                    }});
                    const response = await fetch(`${{supabaseUrl}}/rest/v1/games?${{params.toString()}}`, {{
                        headers: {{
                            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM',
                            'Authorization': `Bearer ${{token}}`,
                            'Content-Type': 'application/json'
                        }}
                    }});

                    const data = await response.json();
                    return {{
                        status: response.status,
                        ok: response.ok,
                        roomId: roomId,
                        count: Array.isArray(data) ? data.length : 0,
                        games: data
                    }};
                }} catch (e) {{
                    return {{ error: e.message }};
                }}
            }}"""

            query_result = page.evaluate(js_code)
            print(f"查询结果: {json.dumps(query_result, indent=2, ensure_ascii=False)}")

            if query_result.get('count', 0) > 0:
                game_id = query_result['games'][0]['id']
                print(f"\n找到游戏ID: {game_id}")

                # 测试 game_hands 查询
                print("\n=== 测试 game_hands 查询 ===")
                hands_js = f"""async () => {{
                    try {{
                        const sessionStr = localStorage.getItem('sb-rzzywltxlfgucngfiznx-auth-token');
                        const session = JSON.parse(sessionStr);
                        const token = session[0]?.access_token || session.access_token;

                        const gameId = "{game_id}";
                        const supabaseUrl = 'https://rzzywltxlfgucngfiznx.supabase.co';

                        const response = await fetch(`${{supabaseUrl}}/rest/v1/game_hands?game_id=eq.${{gameId}}`, {{
                            headers: {{
                                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM',
                                'Authorization': `Bearer ${{token}}`,
                                'Content-Type': 'application/json'
                            }}
                        }});

                        const data = await response.json();
                        return {{
                            status: response.status,
                            count: Array.isArray(data) ? data.length : 0,
                            hands: data
                        }};
                    }} catch (e) {{
                        return {{ error: e.message }};
                    }}
                }}"""

                hands_result = page.evaluate(hands_js)
                print(f"手牌查询结果: {json.dumps(hands_result, indent=2, ensure_ascii=False)}")

        print("\n按Enter关闭浏览器...")
        input()
        browser.close()

test_games_query()
