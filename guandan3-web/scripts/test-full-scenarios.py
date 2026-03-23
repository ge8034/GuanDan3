#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整游戏场景测试 - 捕获所有日志和错误
"""
import sys
import io
from playwright.sync_api import sync_playwright
import time
import json

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("完整游戏场景测试 - 捕获所有日志")
print("=" * 70)

all_messages = []
errors = []
warnings = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1920, 'height': 1080})

    def on_console(msg):
        text = msg.text
        all_messages.append({
            "type": msg.type,
            "text": text,
            "timestamp": time.time()
        })

        if msg.type == "error":
            errors.append(text)
            print(f"[ERROR] {text}")
        elif msg.type == "warning":
            warnings.append(text)
            print(f"[WARN] {text}")
        elif any(kw in text.lower() for kw in ['fetch', 'game', 'turn', 'card', 'hand', 'room', 'auth']):
            print(f"[{msg.type.upper()}] {text}")

    page.on("console", on_console)

    # ========== 场景1: 启动游戏 ==========
    print("\n" + "=" * 70)
    print("[场景1] 启动游戏并进入练习模式")
    print("=" * 70)

    page.goto("http://localhost:3000", wait_until="networkidle", timeout=60000)
    time.sleep(3)

    button = page.query_selector('[data-testid="home-practice"]')
    if not button:
        print("✗ 未找到按钮")
        browser.close()
        sys.exit(1)

    print("✓ 点击开始练习")
    button.click()

    # 等待导航
    for i in range(30):
        time.sleep(1)
        pathname = page.evaluate("() => window.location.pathname")
        if '/room/' in pathname:
            print(f"✓ 成功导航到房间: {pathname}")
            break

    # ========== 场景2: 等待游戏初始化 ==========
    print("\n" + "=" * 70)
    print("[场景2] 等待游戏初始化和发牌")
    print("=" * 70)

    time.sleep(25)

    initial_state = page.evaluate("""() => {
        const cards = document.querySelectorAll('[data-card-id]');
        const playBtn = document.querySelector('[data-testid="room-play"]');
        const passBtn = document.querySelector('[data-testid="room-pass"]');
        const handContainer = document.querySelector('[data-testid="room-hand"]');

        return {
            cardsCount: cards.length,
            sampleCardIds: Array.from(cards).slice(0, 3).map(c => ({
                id: c.getAttribute('data-card-id'),
                selected: c.classList.contains('ring-3'),
                disabled: c.getAttribute('aria-disabled') === 'true'
            })),
            playButtonDisabled: playBtn?.disabled ?? null,
            passButtonDisabled: passBtn?.disabled ?? null,
            handContainerExists: !!handContainer,
            pathname: window.location.pathname
        };
    }""")

    print(f"  手牌容器: {'存在' if initial_state['handContainerExists'] else '不存在'}")
    print(f"  手牌数量: {initial_state['cardsCount']}")
    print(f"  出牌按钮: {'禁用' if initial_state['playButtonDisabled'] else '可用'}")
    print(f"  过牌按钮: {'禁用' if initial_state['passButtonDisabled'] else '可用'}")

    # ========== 场景3: 尝试选择卡牌（如果轮到玩家） ==========
    print("\n" + "=" * 70)
    print("[场景3] 尝试选择和出牌")
    print("=" * 70)

    time.sleep(10)  # 等待可能轮到玩家

    is_my_turn = page.evaluate("""() => {
        const playBtn = document.querySelector('[data-testid="room-play"]');
        return playBtn && !playBtn.disabled;
    }""")

    if is_my_turn:
        print("✓ 轮到玩家出牌")

        cards = page.query_selector_all('[data-card-id]')
        if len(cards) > 0:
            # 选择第一张牌
            first_card = cards[0]
            card_id = first_card.get_attribute('data-card-id')
            print(f"  选择卡牌: {card_id}")
            first_card.click()
            time.sleep(1)

            # 选择第二张牌
            if len(cards) > 1:
                cards[1].click()
                time.sleep(1)

            # 尝试出牌
            play_button = page.query_selector('[data-testid="room-play"]')
            if play_button:
                is_disabled = play_button.get_attribute('disabled') is not None
                if not is_disabled:
                    print("  ✓ 出牌按钮已启用")
                    play_button.click()
                    time.sleep(3)

                    # 检查出牌结果
                    after_state = page.evaluate("""() => {
                        const cards = document.querySelectorAll('[data-card-id]');
                        return { cardsCount: cards.length };
                    }""")

                    if after_state['cardsCount'] < initial_state['cardsCount']:
                        print(f"  ✓ 出牌成功！手牌从 {initial_state['cardsCount']} 减少到 {after_state['cardsCount']}")
                    else:
                        print(f"  ⚠️ 出牌可能被拒绝或正在处理")
                else:
                    print("  ⚠️ 出牌按钮仍然禁用")
    else:
        print("  ⚠️ 还没轮到玩家，尝试过牌")
        pass_button = page.query_selector('[data-testid="room-pass"]')
        if pass_button:
            pass_button.click()
            time.sleep(2)
            print("  ✓ 过牌按钮已点击")

    # ========== 场景4: 等待AI玩家行动 ==========
    print("\n" + "=" * 70)
    print("[场景4] 等待AI玩家行动")
    print("=" * 70)

    print("  等待10秒观察游戏状态...")
    time.sleep(10)

    game_state = page.evaluate("""() => {
        const cards = document.querySelectorAll('[data-card-id]');
        return {
            cardsCount: cards.length,
            pathname: window.location.pathname
        };
    }""")

    print(f"  当前后手牌: {game_state['cardsCount']}")

    # ========== 场景5: 检查页面性能和状态 ==========
    print("\n" + "=" * 70)
    print("[场景5] 检查页面性能和状态")
    print("=" * 70)

    perf_data = page.evaluate("""() => {
        const perfEntries = performance.getEntries();
        const navEntries = perfEntries.filter(e => e.entryType === 'navigation');
        const resourceEntries = perfEntries.filter(e => e.entryType === 'resource');

        return {
            navigationEntries: navEntries.length,
            resourceEntries: resourceEntries.length,
            failedResources: resourceEntries.filter(r => r.transferSize === 0 && r.initiatorType === 'script').length
        };
    }""")

    print(f"  导航条目: {perf_data['navigationEntries']}")
    print(f"  资源条目: {perf_data['resourceEntries']}")
    print(f"  失败资源: {perf_data['failedResources']}")

    # ========== 场景6: 最终状态检查 ==========
    print("\n" + "=" * 70)
    print("[场景6] 最终状态检查")
    print("=" * 70)

    final_state = page.evaluate("""() => {
        const cards = document.querySelectorAll('[data-card-id]');
        const playBtn = document.querySelector('[data-testid="room-play"]');
        const passBtn = document.querySelector('[data-testid="room-pass"]');
        const handContainer = document.querySelector('[data-testid="room-hand"]');
        const roomHeader = document.querySelector('[data-testid="room-header"]');

        return {
            cardsCount: cards.length,
            playButtonExists: !!playBtn,
            passButtonExists: !!passBtn,
            handContainerExists: !!handContainer,
            roomHeaderExists: !!roomHeader,
            pathname: window.location.pathname
        };
    }""")

    for key, value in final_state.items():
        status = "✓" if value else "✗"
        print(f"  {status} {key}: {value}")

    # ========== 汇总结果 ==========
    print("\n" + "=" * 70)
    print("测试结果汇总")
    print("=" * 70)

    print(f"\n消息总数: {len(all_messages)}")
    print(f"错误数量: {len(errors)}")
    print(f"警告数量: {len(warnings)}")

    if errors:
        print(f"\n错误详情:")
        for i, err in enumerate(errors[:10], 1):
            print(f"  {i}. {err}")
        if len(errors) > 10:
            print(f"  ... 还有 {len(errors) - 10} 个错误")

    if warnings:
        print(f"\n警告详情:")
        for i, warn in enumerate(warnings[:5], 1):
            print(f"  {i}. {warn}")
        if len(warnings) > 5:
            print(f"  ... 还有 {len(warnings) - 5} 个警告")

    # 保存完整日志
    log_file = "d:/Learn-Claude/GuanDan3/guandan3-web/test-results/full-scenario-log.json"
    with open(log_file, 'w', encoding='utf-8') as f:
        json.dump({
            "timestamp": time.time(),
            "all_messages": all_messages,
            "errors": errors,
            "warnings": warnings,
            "final_state": final_state
        }, f, indent=2, ensure_ascii=False)

    print(f"\n完整日志已保存到: {log_file}")

    # 判断测试结果
    success_checks = [
        ("导航成功", '/room/' in final_state['pathname']),
        ("手牌容器存在", final_state['handContainerExists']),
        ("出牌按钮存在", final_state['playButtonExists']),
        ("过牌按钮存在", final_state['passButtonExists']),
        ("手牌已初始化", final_state['cardsCount'] > 0),
        ("零控制台错误", len(errors) == 0),
    ]

    passed = sum(1 for _, result in success_checks if result)
    total = len(success_checks)

    print(f"\n通过检查: {passed}/{total}")

    if passed == total:
        print("\n✅ 所有测试通过！")
        exit_code = 0
    else:
        print("\n⚠️ 部分测试未通过")
        for check, result in success_checks:
            status = "✓" if result else "✗"
            print(f"  {status} {check}")
        exit_code = 1

    browser.close()
    sys.exit(exit_code)
