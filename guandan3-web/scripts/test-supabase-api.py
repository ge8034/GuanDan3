#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
直接测试Supabase匿名登录API
"""
import sys
import io
import json
import urllib.request

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

SUPABASE_URL = "https://rzzywltxlfgucngfiznx.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM"

print("测试Supabase匿名登录API...")

# 尝试匿名登录
url = f"{SUPABASE_URL}/auth/v1/user"
headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json'
}

data = json.dumps({
    "email": f"test_{int(__import__('time').time())}@anonymous.com",
    "password": "test_password",
    "gotrue_meta_security": {},
    "data": {}
}).encode()

req = urllib.request.Request(url, data, headers, method='POST')

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        result = json.loads(response.read().decode())
        print(f"响应状态: {response.status}")
        print(f"响应数据: {json.dumps(result, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"请求失败: {e}")

# 尝试正确的匿名登录端点
print("\n尝试正确的匿名登录端点...")
url = f"{SUPABASE_URL}/auth/v1/anonymous?noCache={int(__import__('time').time() * 1000)}"

req = urllib.request.Request(url, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req, timeout=10) as response:
        result = json.loads(response.read().decode())
        print(f"响应状态: {response.status}")
        print(f"响应数据: {json.dumps(result, indent=2, ensure_ascii=False)}")
except urllib.error.HTTPError as e:
    print(f"HTTP错误: {e.code}")
    try:
        error_body = json.loads(e.read().decode())
        print(f"错误详情: {json.dumps(error_body, indent=2, ensure_ascii=False)}")
    except:
        print(f"错误响应: {e.read()}")
except Exception as e:
    print(f"请求失败: {e}")
