"""
直接检查数据库状态
"""
import os
import json
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("错误: 缺少 Supabase URL 或 Key")
    print(f"URL: {url}")
    print(f"Key: {key}")
    exit(1)

print(f"URL: {url}")
print(f"Key: {key[:30]}...")

from supabase import create_client

supabase = create_client(url, key)

# 1. 登录测试用户
print("\n=== 登录 ===")
import random
import time

# 生成唯一的测试用户
random_num = random.randint(1000, 9999)
test_email = f"testuser{random_num}@test.com"
test_password = "Test123456"

try:
    response = supabase.auth.sign_in_with_password({
        "email": test_email,
        "password": test_password
    })
    user = response.user
    print(f"User ID: {user.id}")
except Exception as e:
    print(f"登录失败: {e}")
    # 尝试注册
    try:
        response = supabase.auth.sign_up({
            "email": test_email,
            "password": test_password,
            "options": {
                "data": {
                    "nickname": f"测试用户{random_num}"
                }
            }
        })
        user = response.user
        print(f"注册成功，User ID: {user.id}")
        if not user:
            print("注册可能需要邮箱验证")
            exit(1)
        # 等待一下让用户创建完成
        time.sleep(1)
    except Exception as e2:
        print(f"注册也失败: {e2}")
        exit(1)

user_id = user.id

# 2. 创建练习房间
print("\n=== 创建练习房间 ===")
try:
    room_response = supabase.rpc('create_practice_room', {'p_visibility': 'private'}).execute()
    print(f"创建房间响应: {room_response}")

    # 检查返回的房间ID
    if room_response.data:
        if isinstance(room_response.data, list) and len(room_response.data) > 0:
            room_id = room_response.data[0].get('room_id')
        elif isinstance(room_response.data, dict):
            room_id = room_response.data.get('room_id')
        else:
            room_id = str(room_response.data)

        print(f"提取的房间ID: {room_id}")
    else:
        print("没有返回数据")
        room_id = None
except Exception as e:
    print(f"创建房间失败: {e}")
    import traceback
    traceback.print_exc()
    room_id = None

if not room_id:
    print("无法获取房间ID")
    exit(1)

# 3. 检查房间记录
print(f"\n=== 检查房间记录 (room_id={room_id}) ===")
try:
    rooms_response = supabase.table('rooms').select('*').eq('id', room_id).execute()
    print(f"房间记录: {len(rooms_response.data)}")
    if rooms_response.data:
        for r in rooms_response.data:
            print(f"  - id: {r['id']}, mode: {r.get('mode')}, status: {r.get('status')}, visibility: {r.get('visibility')}")
    else:
        print("  没有找到房间记录")
except Exception as e:
    print(f"查询房间失败: {e}")

# 4. 检查成员记录
print(f"\n=== 检查成员记录 ===")
try:
    members_response = supabase.table('room_members').select('*').eq('room_id', room_id).execute()
    print(f"成员记录: {len(members_response.data)}")
    if members_response.data:
        for m in members_response.data:
            print(f"  - seat_no: {m['seat_no']}, uid: {m.get('uid')}, member_type: {m.get('member_type')}, ai_key: {m.get('ai_key')}")
    else:
        print("  没有找到成员记录")
except Exception as e:
    print(f"查询成员失败: {e}")

# 5. 开始游戏
print(f"\n=== 开始游戏 ===")
try:
    start_response = supabase.rpc('start_game', {'p_room_id': room_id}).execute()
    print(f"开始游戏响应: {start_response}")
except Exception as e:
    print(f"开始游戏失败: {e}")

# 6. 检查游戏记录
print(f"\n=== 检查游戏记录 ===")
try:
    games_response = supabase.table('games').select('*').eq('room_id', room_id).execute()
    print(f"游戏记录: {len(games_response.data)}")
    if games_response.data:
        for g in games_response.data:
            print(f"  - game_id: {g['id']}, status: {g.get('status')}, turn_no: {g.get('turn_no')}")
            game_id = g['id']
    else:
        print("  没有找到游戏记录")
        game_id = None
except Exception as e:
    print(f"查询游戏失败: {e}")
    game_id = None

# 7. 检查手牌记录
print(f"\n=== 检查手牌记录 ===")
if game_id:
    try:
        hands_response = supabase.table('game_hands').select('*').eq('game_id', game_id).execute()
        print(f"手牌记录: {len(hands_response.data)}")
        if hands_response.data:
            for h in hands_response.data:
                hand_size = len(h['hand']) if h.get('hand') else 0
                print(f"  - game_id: {h['game_id']}, seat_no: {h['seat_no']}, hand_size: {hand_size}")
        else:
            print("  没有找到手牌记录")
    except Exception as e:
        print(f"查询手牌失败: {e}")
else:
    print("没有游戏ID，跳过手牌查询")

# 8. 测试直接查询所有手牌（忽略 RLS）
print(f"\n=== 测试绕过 RLS 查询手牌 ===")
if game_id:
    try:
        # 使用 RPC 来绕过 RLS
        test_response = supabase.rpc('get_ai_hand', {'p_game_id': game_id, 'p_seat_no': 0}).execute()
        print(f"get_ai_hand 响应: {test_response}")
    except Exception as e:
        print(f"get_ai_hand 失败: {e}")

print("\n=== 完成 ===")
