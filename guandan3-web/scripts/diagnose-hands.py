"""
直接查询数据库诊断手牌问题
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# 使用 Supabase Python 客户端
try:
    from supabase import create_client, Client
except ImportError:
    print("Supabase 客户端未安装，请运行: pip install supabase")
    sys.exit(1)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("错误: 缺少 Supabase URL 或 Key")
    sys.exit(1)

print(f"Supabase URL: {url}")

# 创建客户端
supabase: Client = create_client(url, key)

# 获取当前用户信息
print("\n=== 获取用户信息 ===")
try:
    user_response = supabase.auth.get_user()
    print(f"User response: {user_response}")
except Exception as e:
    print(f"获取用户失败: {e}")

# 手动登录测试用户
print("\n=== 尝试登录 ===")
try:
    # 使用默认测试用户或注册新用户
    email = "test@example.com"
    password = "test123456"

    try:
        # 尝试登录
        auth_response = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        print(f"登录成功: {auth_response}")
        user = auth_response.user
        print(f"User ID: {user.id if user else 'None'}")
    except Exception as login_error:
        print(f"登录失败: {login_error}")
        print("尝试注册新用户...")
        try:
            sign_up_response = supabase.auth.sign_up({
                "email": email,
                "password": password
            })
            print(f"注册成功: {sign_up_response}")
            user = sign_up_response.user
            print(f"User ID: {user.id if user else 'None'}")
        except Exception as signup_error:
            print(f"注册失败: {signup_error}")
            sys.exit(1)
except Exception as e:
    print(f"认证过程出错: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# 获取当前用户的ID
try:
    current_user = supabase.auth.get_user()
    user_id = current_user.user.id if current_user.user else None
    print(f"\n当前用户ID: {user_id}")
except:
    print("\n无法获取用户ID")
    user_id = None

if not user_id:
    print("错误: 无法获取用户ID")
    sys.exit(1)

# 检查用户的 room_members
print("\n=== 检查用户的房间成员 ===")
try:
    members_response = supabase.table('room_members').select('*').eq('uid', user_id).execute()
    print(f"找到的成员记录: {len(members_response.data)}")
    for member in members_response.data:
        print(f"  - room_id: {member['room_id']}, seat_no: {member['seat_no']}, member_type: {member['member_type']}")
        room_id = member['room_id']
except Exception as e:
    print(f"查询 room_members 失败: {e}")
    import traceback
    traceback.print_exc()

if not members_response.data:
    print("没有找到成员记录，创建一个练习房间...")
    try:
        # 使用 RPC 创建房间
        room_response = supabase.rpc('create_practice_room').execute()
        print(f"创建房间响应: {room_response}")
        if room_response.data:
            room_id = room_response.data[0].get('room_id') if isinstance(room_response.data, list) else None
            print(f"新房间ID: {room_id}")
    except Exception as e:
        print(f"创建房间失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# 检查游戏状态
print(f"\n=== 检查房间 {room_id} 的游戏 ===")
try:
    games_response = supabase.table('games').select('*').eq('room_id', room_id).execute()
    print(f"找到的游戏: {len(games_response.data)}")
    for game in games_response.data:
        print(f"  - game_id: {game['id']}, status: {game['status']}")
        game_id = game['id']
except Exception as e:
    print(f"查询游戏失败: {e}")
    game_id = None

if not game_id:
    print("\n没有游戏，尝试开始游戏...")
    try:
        start_response = supabase.rpc('start_game', {'p_room_id': room_id}).execute()
        print(f"开始游戏响应: {start_response}")

        # 重新查询游戏
        games_response = supabase.table('games').select('*').eq('room_id', room_id).execute()
        if games_response.data:
            game_id = games_response.data[0]['id']
            print(f"游戏ID: {game_id}")
    except Exception as e:
        print(f"开始游戏失败: {e}")
        import traceback
        traceback.print_exc()

# 检查手牌
print(f"\n=== 检查游戏 {game_id} 的手牌 ===")
try:
    hands_response = supabase.table('game_hands').select('*').eq('game_id', game_id).execute()
    print(f"找到的手牌记录: {len(hands_response.data)}")
    for hand in hands_response.data:
        print(f"  - game_id: {hand['game_id']}, seat_no: {hand['seat_no']}, hand_size: {len(hand['hand']) if hand['hand'] else 0}")
except Exception as e:
    print(f"查询手牌失败: {e}")
    print(f"错误详情: {str(e)}")
    import traceback
    traceback.print_exc()

print("\n=== 诊断完成 ===")
