"""
检查导航问题
"""
from playwright.sync_api import sync_playwright
import time

def test_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()

        # 监听导航
        navigated_urls = []
        def handle_navigation(frame):
            navigated_urls.append(frame.url)
            print(f"导航到: {frame.url}")

        page.on("framenavigated", handle_navigation)

        # 收集控制台消息
        errors = []
        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)
                print(f"[ERROR] {msg.text[:200]}")

        page.on("console", on_console)

        print("=== 访问首页 ===")
        page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)

        print("\n=== 检查按钮 ===")
        practice_btn = page.locator('[data-testid="home-practice"]')
        is_visible = practice_btn.is_visible()
        print(f"按钮可见: {is_visible}")
        if is_visible:
            print(f"按钮文本: {practice_btn.text_content()}")

        print("\n=== 点击按钮 ===")
        # 等待一小段时间确保页面加载完成
        page.wait_for_timeout(1000)

        # 点击按钮
        practice_btn.click()

        print("\n=== 等待导航 ===")
        # 等待最多10秒检查导航
        start_time = time.time()
        while time.time() - start_time < 10:
            page.wait_for_timeout(100)
            current_url = page.url
            if "/room/" in current_url:
                print(f"成功导航到: {current_url}")
                break
        else:
            print(f"10秒后仍未导航，当前URL: {page.url}")

        # 检查是否有错误
        print("\n=== 控制台错误 ===")
        print(f"错误数量: {len(errors)}")
        for i, err in enumerate(errors[:10]):
            print(f"{i+1}. {err[:200]}")

        print("\n=== 按Enter关闭浏览器 ===")
        input()
        browser.close()

test_navigation()
