import { chromium } from 'playwright';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://127.0.0.1:5173';
const SCREENSHOT = process.env.SCREENSHOT || '/tmp/cosmos-safety-lens/dashboard/artifacts/setup-check.png';
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 90000);

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });

  const started = Date.now();
  try {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    const preflightVisible = await page.locator('.preflight-error').first().isVisible().catch(() => false);
    if (preflightVisible) {
      const msg = (await page.locator('.preflight-error').first().innerText()).trim();
      await page.screenshot({ path: SCREENSHOT, fullPage: true });
      console.log(JSON.stringify({ ok: false, elapsed_ms: Date.now() - started, dashboard_url: DASHBOARD_URL, error: msg, screenshot: SCREENSHOT }, null, 2));
      process.exitCode = 2;
      return;
    }

    await page.getByRole('button', { name: /Near-Miss Collision/i }).click();

    // Wait for either an error or timeline/results to appear.
    const outcome = await Promise.race([
      page.waitForSelector('.error', { timeout: TIMEOUT_MS }).then(() => 'error'),
      page.waitForSelector('.event-timeline', { timeout: TIMEOUT_MS }).then(() => 'ok')
    ]);

    await page.screenshot({ path: SCREENSHOT, fullPage: true });

    if (outcome === 'error') {
      const msg = (await page.locator('.error').first().innerText()).trim();
      console.log(JSON.stringify({ ok: false, elapsed_ms: Date.now() - started, dashboard_url: DASHBOARD_URL, error: msg, screenshot: SCREENSHOT }, null, 2));
      process.exitCode = 2;
      return;
    }

    console.log(JSON.stringify({ ok: true, elapsed_ms: Date.now() - started, dashboard_url: DASHBOARD_URL, screenshot: SCREENSHOT }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2));
  process.exit(1);
});
