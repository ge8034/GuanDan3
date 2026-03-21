#!/usr/bin/env python3
"""
游戏页面测试脚本 - 捕获控制台日志和错误
用于分析游戏页面的运行时问题
"""
from playwright.sync_api import sync_playwright
import json
from datetime import datetime
from pathlib import Path
import sys
import io

# 修复 Windows 控制台编码问题
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


def main():
    """测试游戏页面并捕获所有控制台输出"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path("test-results/game-page-test")
    output_dir.mkdir(parents=True, exist_ok=True)

    console_logs = []
    console_errors = []
    page_errors = []
    network_errors = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir=str(output_dir / "videos"),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        # 捕获控制台日志
        def handle_console(msg):
            log_entry = {
                'type': msg.type,
                'text': msg.text(),
                'timestamp': datetime.now().isoformat(),
                'location': f"{msg.location.get('url', 'unknown')}:{msg.location.get('lineNumber', '?')}"
            }
            console_logs.append(log_entry)
            print(f"[{msg.type().upper()}] {msg.text()}")

            if msg.type() == 'error':
                console_errors.append(log_entry)

        page.on('console', handle_console)

        # 捕获页面错误
        def handle_page_error(error):
            error_entry = {
                'message': str(error),
                'timestamp': datetime.now().isoformat()
            }
            page_errors.append(error_entry)
            print(f"[PAGE ERROR] {error}")

        page.on('pageerror', handle_page_error)

        # 捕获网络请求失败
        def handle_request_failed(request):
            failure = request.failure()
            if failure:
                error_entry = {
                    'url': request.url,
                    'error': failure.error_text,
                    'timestamp': datetime.now().isoformat()
                }
                network_errors.append(error_entry)
                print(f"[NETWORK ERROR] {request.url} - {failure.error_text}")

        page.on('requestfailed', handle_request_failed)

        # 导航到游戏页面
        print(f"\n{'='*60}")
        print("导航到游戏页面: http://localhost:3000")
        print(f"{'='*60}\n")

        try:
            page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            print("✓ 页面加载完成")

            # 等待一段时间让页面完全初始化
            page.wait_for_timeout(5000)

            # 截图
            screenshot_path = output_dir / f"screenshot_{timestamp}.png"
            page.screenshot(path=str(screenshot_path), full_page=True)
            print(f"✓ 截图已保存: {screenshot_path}")

            # 获取页面标题
            title = page.title()
            print(f"✓ 页面标题: {title}")

            # 获取页面内容摘要
            content = page.content()
            print(f"✓ 页面内容长度: {len(content)} 字符")

            # 查找关键元素
            try:
                # 检查是否有 Phaser canvas
                canvas_count = page.locator('canvas').count()
                print(f"✓ Canvas 元素数量: {canvas_count}")

                # 检查是否有游戏相关的按钮
                buttons = page.locator('button').all()
                print(f"✓ Button 元素数量: {len(buttons)}")

                for i, btn in enumerate(buttons[:10]):  # 只显示前10个
                    try:
                        text = btn.text_content() or ""
                        if text.strip():
                            print(f"  - Button {i+1}: {text[:50]}")
                    except:
                        pass

            except Exception as e:
                print(f"⚠ 元素检查时出错: {e}")

        except Exception as e:
            print(f"✗ 页面导航失败: {e}")
            page_errors.append({
                'message': f"Navigation failed: {e}",
                'timestamp': datetime.now().isoformat()
            })

        # 保存日志到文件
        log_file = output_dir / f"console_logs_{timestamp}.json"
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump({
                'console_logs': console_logs,
                'console_errors': console_errors,
                'page_errors': page_errors,
                'network_errors': network_errors,
                'summary': {
                    'total_console_messages': len(console_logs),
                    'total_console_errors': len(console_errors),
                    'total_page_errors': len(page_errors),
                    'total_network_errors': len(network_errors),
                    'timestamp': timestamp
                }
            }, f, indent=2, ensure_ascii=False)

        print(f"\n{'='*60}")
        print("日志摘要")
        print(f"{'='*60}")
        print(f"总控制台消息: {len(console_logs)}")
        print(f"控制台错误: {len(console_errors)}")
        print(f"页面错误: {len(page_errors)}")
        print(f"网络错误: {len(network_errors)}")
        print(f"日志已保存: {log_file}")
        print(f"{'='*60}\n")

        # 如果有错误，显示详细信息
        if console_errors:
            print("\n控制台错误详情:")
            for err in console_errors:
                print(f"  - {err['text']}")

        if page_errors:
            print("\n页面错误详情:")
            for err in page_errors:
                print(f"  - {err['message']}")

        if network_errors:
            print("\n网络错误详情:")
            for err in network_errors:
                print(f"  - {err['url']}: {err['error']}")

        browser.close()


if __name__ == '__main__':
    main()
