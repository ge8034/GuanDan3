import { test, expect } from '@playwright/test';

test.describe('性能基线', () => {
  test.setTimeout(180000);

  const collect = async (page: any) => {
    return await page.evaluate(() => {
      return (window as any).__perfBaseline || null;
    });
  };

  const setup = async (page: any) => {
    await page.addInitScript(() => {
      (window as any).__perfBaseline = {
        lcp: null as number | null,
        cls: 0,
        fcp: null as number | null,
        ttfb: null as number | null,
      };

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            (window as any).__perfBaseline.cls += entry.value;
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true } as any);

      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) {
          (window as any).__perfBaseline.lcp = last.startTime;
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true } as any);

      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (entry.name === 'first-contentful-paint') {
            (window as any).__perfBaseline.fcp = entry.startTime;
          }
        }
      });
      paintObserver.observe({ type: 'paint', buffered: true } as any);
    });
  };

  test('Lobby 指标不退化', async ({ page }) => {
    await setup(page);
    await page.goto('http://localhost:3000/lobby', { timeout: 30000, waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: '对战大厅' })).toBeVisible({ timeout: 60000 });

    await page.waitForLoadState('networkidle', { timeout: 60000 });
    await page.waitForTimeout(1500);

    const nav = await page.evaluate(() => {
      const e = performance.getEntriesByType('navigation')[0] as any;
      if (!e) return null;
      const ttfb = (e.responseStart ?? 0) - (e.requestStart ?? 0);
      return { ttfb };
    });
    if (nav?.ttfb != null) {
      await page.evaluate((ttfb: number) => {
        (window as any).__perfBaseline.ttfb = ttfb;
      }, nav.ttfb);
    }

    const metrics = await collect(page);
    test.info().attach('perf-baseline', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json',
    });

    expect(metrics).toBeTruthy();
    expect(typeof metrics.cls).toBe('number');
    expect(metrics.cls).toBeLessThan(0.25);
    if (typeof metrics.lcp === 'number') expect(metrics.lcp).toBeLessThan(6000);
    if (typeof metrics.fcp === 'number') expect(metrics.fcp).toBeLessThan(3000);
    if (typeof metrics.ttfb === 'number') expect(metrics.ttfb).toBeLessThan(1500);
  });
});

