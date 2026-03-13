import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Artifacts directories
const LOGS_DIR = path.join(__dirname, 'artifacts', 'logs');
const SCREENSHOTS_DIR = path.join(__dirname, 'artifacts', 'screenshots');

// Ensure directories exist
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Generate timestamp for this run
const runTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const consoleLogPath = path.join(LOGS_DIR, `game_console_${runTimestamp}.json`);

// Helper to write log
const writeLog = (entry: object) => {
  fs.appendFileSync(consoleLogPath, JSON.stringify(entry) + ',\n');
};

test.use({
  trace: 'on',
  video: 'on',
  screenshot: 'on',
});

test.describe.skip('GuanDan3 Comprehensive Debug & Test', () => {
  test.setTimeout(180000);

  test('Core Game Flow with Logging and Monitoring', async ({ page, context }) => {
    // 2. Inject Console & Error Capturing
    const consoleLogs: any[] = [];
    
    // Initialize log file
    fs.writeFileSync(consoleLogPath, '[\n');

    page.on('console', msg => {
      const entry = {
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      };
      consoleLogs.push(entry);
      writeLog(entry);
      console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      const entry = {
        timestamp: new Date().toISOString(),
        type: 'PAGE_ERROR',
        message: err.message,
        stack: err.stack,
      };
      writeLog(entry);
      console.error(`BROWSER ERROR: ${err.message}`);
    });

    page.on('requestfailed', request => {
      const entry = {
        timestamp: new Date().toISOString(),
        type: 'REQUEST_FAILED',
        url: request.url(),
        method: request.method(),
        failure: request.failure()?.errorText,
      };
      writeLog(entry);
      console.error(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 1. Start Browser & Navigate
    console.log('Step 1: Navigation & Environment Check');
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    
    const viewport = page.viewportSize();
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const url = page.url();
    
    writeLog({
      timestamp: new Date().toISOString(),
      type: 'INFO',
      message: 'Environment Info',
      data: { url, viewport, userAgent }
    });
    
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_01_homepage.png`) });

    // 3. Simulate Core Functions
    
    // Action: Create/Enter Room (Login)
    console.log('Step 3.1: Enter Practice Room');
    const practiceBtn = page.getByRole('button', { name: /练习房/i });
    await expect(practiceBtn).toBeVisible();
    await practiceBtn.click();
    
    await page.waitForURL(/\/room\/.+/);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_02_room_entered.png`) });

    // Action: Start Game
    console.log('Step 3.2: Start Game');
    const startBtn = page.getByRole('button', { name: /开始游戏/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    
    // Wait for game initialization
    await expect(page.getByText(/回合：座位/i)).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_03_game_started.png`) });

    // Action: Play Hand (or wait for turn)
    console.log('Step 3.3: Play Hand');
    
    // Determine seat
    const turnText = await page.getByText(/回合：座位 (\d+)/i).textContent();
    const currentSeat = turnText?.match(/回合：座位 (\d+)/)?.[1];
    
    if (currentSeat === '0') {
        console.log('It is my turn (Seat 0). Playing cards...');
        
        // Mock Error Test (Optional: Mock submit_turn to fail once to test UI resilience)
        // We will intercept the next POST to /rpc/submit_turn if we wanted to test failure
        // For this run, let's test SUCCESS flow first to ensure baseline is green.
        
        // Select cards
        const handArea = page.locator('.col-span-3.row-start-3');
        await expect(handArea).toBeVisible();
        const firstCard = handArea.locator('div.cursor-pointer').first();
        await firstCard.click();
        await expect(firstCard).toHaveClass(/translate-y-8/); // Verify selection
        
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_04_cards_selected.png`) });

        // Click Play
        const playBtn = page.getByRole('button', { name: /出牌/i });
        await playBtn.click();
        
        // Wait for UI update
        // We expect "Last: Me" or similar update in the table area
        await expect(page.locator('text=上一手：')).toBeVisible({ timeout: 10000 });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_05_turn_played.png`) });
    } else {
        console.log(`当前回合座位 ${currentSeat}，等待 AI...`);
        // Wait for AI to play
        await expect(page.locator('text=上一手：')).toBeVisible({ timeout: 10000 });
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_05_ai_played.png`) });
    }

    // Action: Mock Network Failure (Robustness Test)
    // Let's try to Pass (if it's my turn again) or just Mock a request
    // Since we might not be in turn, let's just refresh page to verify reconnection (State Recovery)
    console.log('Step 3.4: Test Reconnection / Refresh');
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(/回合：座位/i)).toBeVisible();
    // Verify Last Action is still visible (State Recovery)
    await expect(page.locator('text=上一手：')).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${runTimestamp}_06_reconnected.png`) });

    // Close JSON array in log file
    fs.appendFileSync(consoleLogPath, '{}]\n'); // Close the JSON array properly-ish (last comma handling is lazy here but valid for review)
    
    console.log(`Test Finished. Logs saved to ${consoleLogPath}`);
  });
});
