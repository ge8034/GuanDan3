#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试Supabase认证
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("测试Supabase认证...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()

    # 监控网络请求
    def log_request(request):
        if 'auth' in request.url or 'supabase' in request.url:
            print(f"[REQUEST] {request.method} {request.url}")

    def log_response(response):
        if 'auth' in response.url or 'supabase' in response.url:
            print(f"[RESPONSE] {response.status} {response.url}")

    page.on('request', log_request)
    page.on('response', log_response)

    # 监控控制台
    def on_console(msg):
        print(f"[CONSOLE] {msg.text}")

    page.on('console', on_console)

    print("访问首页...")
    page.goto("http://localhost:3000", wait_until="networkidle")
    time.sleep(3)

    # 尝试在控制台直接调用Supabase
    print("\n尝试在控制台调用Supabase匿名登录...")
    result = page.evaluate("""async () => {
        try {
            const supabaseModule = await import('/src/lib/supabase/client.js');
            const supabase = supabaseModule.supabase;

            console.log('开始匿名登录...');
            const { data, error } = await supabase.auth.signInAnonymously();

            return {
                success: !error,
                user: data?.user?.id || null,
                error: error?.message || null
            };
        } catch(e) {
            return {
                success: false,
                error: e.message || String(e)
            };
        }
    }""")

    print(f"登录结果: {result}")

    print("\n等待10秒...")
    time.sleep(10)

    browser.close()
