import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://127.0.0.1:5173';
const ARTIFACT_ROOT = process.env.ARTIFACT_ROOT || '/tmp/cosmos-safety-lens/dashboard/artifacts/visual-run';
const WAIT_MS = Number(process.env.WAIT_MS || 1400);
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 90000);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function snap(page, dir, name) {
  const out = path.join(dir, name);
  await page.screenshot({ path: out, fullPage: true });
  return out;
}

async function run() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const runDir = path.join(ARTIFACT_ROOT, ts);
  const shotsDir = path.join(runDir, 'shots');
  const videoDir = path.join(runDir, 'video');
  const tracePath = path.join(runDir, 'trace.zip');
  ensureDir(shotsDir);
  ensureDir(videoDir);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 920 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 920 } }
  });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
  const page = await context.newPage();
  const video = page.video();
  const shots = [];

  const started = Date.now();
  let ok = false;
  let error = '';

  try {
    await page.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    shots.push(await snap(page, shotsDir, '01-home.png'));

    await page.waitForTimeout(WAIT_MS);
    shots.push(await snap(page, shotsDir, '02-after-preflight-wait.png'));

    const preflightVisible = await page.locator('.preflight-error').first().isVisible().catch(() => false);
    if (preflightVisible) {
      error = (await page.locator('.preflight-error').first().innerText()).trim();
      shots.push(await snap(page, shotsDir, '03-preflight-blocked.png'));
      return;
    }

    await page.getByRole('button', { name: /Near-Miss Collision/i }).click();
    shots.push(await snap(page, shotsDir, '03-clicked-demo.png'));

    const outcome = await Promise.race([
      page.waitForSelector('.error', { timeout: TIMEOUT_MS }).then(() => 'error'),
      page.waitForSelector('.event-timeline', { timeout: TIMEOUT_MS }).then(() => 'ok')
    ]);

    if (outcome === 'error') {
      error = (await page.locator('.error').first().innerText()).trim();
      shots.push(await snap(page, shotsDir, '04-analyze-error.png'));
      return;
    }

    ok = true;
    shots.push(await snap(page, shotsDir, '04-success-timeline.png'));
  } finally {
    await context.tracing.stop({ path: tracePath });
    await context.close();
    await browser.close();

    const videoPath = video ? await video.path() : null;
    console.log(JSON.stringify({
      ok,
      elapsed_ms: Date.now() - started,
      dashboard_url: DASHBOARD_URL,
      error: error || undefined,
      run_dir: runDir,
      shots,
      video: videoPath,
      trace: tracePath
    }, null, 2));
    if (!ok) process.exitCode = 2;
  }
}

run().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2));
  process.exit(1);
});

