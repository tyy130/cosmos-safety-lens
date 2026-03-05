import { chromium } from 'playwright';

const RAILWAY_VARS_URL = 'https://railway.com/project/98386c24-320d-41bf-8bd7-1ec4d2423323/service/e1361e81-b7c2-4297-81b7-9d9aca873324/variables';
const NVIDIA_DEPLOY_URL = 'https://build.nvidia.com/spark/vss/instructions';
const NVIDIA_API_EXAMPLES_URL = 'https://docs.nvidia.com/nim/vision-language-models/1.6.0/examples/cosmos-reason2/api.html';
const DIAG_CALLABLE_URL = 'https://cosmos-safety-lens-api-production.up.railway.app/diag/callable';
const ANALYZE_URL = 'https://cosmos-safety-lens-api-production.up.railway.app/analyze';
const TEST_CLIP_URL = 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00002.mp4';
const DASHBOARD_URL = 'http://127.0.0.1:5173';

function statusHtml() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Cosmos Setup Assistant</title>
    <style>
      body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #0b1020; color: #e8eeff; }
      .wrap { max-width: 980px; margin: 0 auto; padding: 28px 20px; }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p { margin: 0 0 14px; color: #a5b4da; }
      .card { background: #131a30; border: 1px solid #2a355f; border-radius: 12px; padding: 16px; margin-top: 14px; }
      .muted { color: #9cb0e6; font-size: 14px; }
      .state { font-size: 18px; font-weight: 700; margin: 6px 0 10px; }
      .ok { color: #8dffbf; }
      .bad { color: #ff9a9a; }
      code { background: #11172c; border: 1px solid #29365e; border-radius: 6px; padding: 2px 6px; color: #c7d7ff; }
      ul { margin: 8px 0 0 20px; }
      li { margin: 6px 0; }
      a { color: #98bbff; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <h1>Interactive Setup Assistant</h1>
      <p>Use the other opened tabs to configure a callable Cosmos Reason2 endpoint and key. This page updates live.</p>
      <div class="card">
        <div class="muted">Current readiness</div>
        <div id="state" class="state bad">Checking...</div>
        <div id="detail" class="muted"></div>
      </div>
      <div class="card">
        <div><strong>Required Railway variables</strong></div>
        <ul>
          <li><code>NVIDIA_MODEL=nvidia/cosmos-reason2-8b</code></li>
          <li><code>NVIDIA_API_BASE=&lt;your callable NIM /v1 base&gt;</code></li>
          <li><code>NVIDIA_API_KEY=&lt;key for that endpoint&gt;</code></li>
        </ul>
      </div>
      <div class="card">
        <div><strong>When callable turns true:</strong></div>
        <ul>
          <li>Assistant auto-runs a real <code>/analyze</code> check.</li>
          <li>If success, open the dashboard and test a demo clip.</li>
        </ul>
      </div>
      <div class="card muted">
        Docs: <a href="${NVIDIA_API_EXAMPLES_URL}" target="_blank">Cosmos Reason2 API Examples</a>
      </div>
    </div>
  </body>
</html>`;
}

async function updateStatusPage(page, ready, detail) {
  await page.evaluate(({ ready, detail }) => {
    const state = document.getElementById('state');
    const d = document.getElementById('detail');
    if (!state || !d) return;
    state.textContent = ready ? 'Callable: true' : 'Callable: false';
    state.className = `state ${ready ? 'ok' : 'bad'}`;
    d.textContent = detail;
  }, { ready, detail });
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function run() {
  const context = await chromium.launchPersistentContext('/tmp/cosmos-safety-lens/.pw-interactive-profile', {
    headless: false,
    viewport: null,
    slowMo: 250,
    args: ['--start-maximized']
  });

  const statusPage = await context.newPage();
  await statusPage.setContent(statusHtml(), { waitUntil: 'domcontentloaded' });

  const railwayPage = await context.newPage();
  await railwayPage.goto(RAILWAY_VARS_URL, { waitUntil: 'domcontentloaded' });

  const deployPage = await context.newPage();
  await deployPage.goto(NVIDIA_DEPLOY_URL, { waitUntil: 'domcontentloaded' });

  const apiDocPage = await context.newPage();
  await apiDocPage.goto(NVIDIA_API_EXAMPLES_URL, { waitUntil: 'domcontentloaded' });

  console.log('Interactive tabs opened:');
  console.log(`- Railway variables: ${RAILWAY_VARS_URL}`);
  console.log(`- NVIDIA deploy instructions: ${NVIDIA_DEPLOY_URL}`);
  console.log(`- API examples: ${NVIDIA_API_EXAMPLES_URL}`);
  console.log('Polling /diag/callable every 8s...');

  let passed = false;
  const interval = setInterval(async () => {
    try {
      const { json } = await fetchJson(DIAG_CALLABLE_URL);
      const ready = Boolean(json?.callable);
      const detail = ready
        ? `model=${json.model} base=${json.api_base}`
        : (json?.error ?? 'Runtime not callable yet');

      await updateStatusPage(statusPage, ready, detail);
      console.log(`[diag] callable=${ready} :: ${detail}`);

      if (ready && !passed) {
        passed = true;
        clearInterval(interval);
        const analyze = await fetchJson(ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video_url: TEST_CLIP_URL })
        });
        console.log(`[analyze] status=${analyze.status} body=${JSON.stringify(analyze.json).slice(0, 500)}`);
        await updateStatusPage(statusPage, true, `Callable and analyze check returned status ${analyze.status}.`);
        const appPage = await context.newPage();
        await appPage.goto(DASHBOARD_URL, { waitUntil: 'domcontentloaded' });
        console.log(`Opened dashboard: ${DASHBOARD_URL}`);
      }
    } catch (err) {
      const detail = `Polling error: ${String(err)}`;
      await updateStatusPage(statusPage, false, detail);
      console.log(`[diag] ${detail}`);
    }
  }, 8000);

  process.on('SIGINT', async () => {
    clearInterval(interval);
    await context.close();
    process.exit(0);
  });
}

run().catch((err) => {
  console.error(`interactive setup failed: ${String(err)}`);
  process.exit(1);
});

