import { Router, type Request, type Response } from 'express';

const DEFAULT_NIM_API_BASE = 'https://integrate.api.nvidia.com/v1';
const DOCS = {
  apiExamples: 'https://docs.nvidia.com/nim/vision-language-models/1.6.0/examples/cosmos-reason2/api.html',
  forumStatus: 'https://forums.developer.nvidia.com/t/function-not-found-for-account/357670',
  localDeploy: 'https://build.nvidia.com/spark/vss/instructions'
} as const;

interface NimModelsResponse {
  data?: Array<{ id?: string }>;
}

function getConfiguredModel(): string {
  return (process.env.NVIDIA_MODEL ?? 'nvidia/cosmos-reason2-8b').trim();
}

function compact(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function remediationFor(status: number, body: string, apiBase: string, model: string): string[] {
  const detail = compact(body).toLowerCase();
  if (status === 404 && detail.includes('not found for account')) {
    return [
      `This NVIDIA account cannot invoke ${model} on ${apiBase} right now.`,
      'Best practice: self-host/deploy Cosmos Reason2 NIM and set NVIDIA_API_BASE to that /v1 endpoint.',
      `Then verify with /diag/callable before running analysis. Docs: ${DOCS.apiExamples} | ${DOCS.localDeploy}`,
      `Context on this specific 404 behavior: ${DOCS.forumStatus}`
    ];
  }

  if (status === 401 || status === 403) {
    return [
      'API key is invalid or lacks access for this endpoint/model.',
      'Rotate NVIDIA_API_KEY and re-run /diag/models and /diag/callable.',
      `Reference: ${DOCS.apiExamples}`
    ];
  }

  if (status === 404) {
    return [
      'Configured NVIDIA_API_BASE or model is likely incorrect for this runtime.',
      'Check NVIDIA_API_BASE includes /v1 and NVIDIA_MODEL matches a callable model ID from /diag/models.',
      `Reference: ${DOCS.apiExamples}`
    ];
  }

  return [
    'Runtime is not callable yet. Verify endpoint, key, and model alignment.',
    'Use /diag/models then /diag/callable to validate before Analyze.'
  ];
}

export const diagRouter = Router();

function getNimApiBase(): string {
  const fromEnv = process.env.NVIDIA_API_BASE?.trim();
  const base = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_NIM_API_BASE;
  return base.replace(/\/+$/, '');
}

diagRouter.get('/models', async (_req: Request, res: Response) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Backend not configured: NVIDIA_API_KEY missing.' });
    return;
  }

  try {
    const response = await fetch(`${getNimApiBase()}/models`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    if (!response.ok) {
      const body = compact(await response.text()).slice(0, 280);
      res.status(502).json({ error: `NVIDIA models endpoint error ${response.status}${body ? `: ${body}` : ''}` });
      return;
    }

    const payload = await response.json() as NimModelsResponse;
    const allModelIds = Array.isArray(payload.data)
      ? payload.data.map(item => item.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const cosmosReasonModels = allModelIds
      .filter(id => id.toLowerCase().includes('cosmos-reason'))
      .sort();

    res.json({
      ok: true,
      api_base: getNimApiBase(),
      all_model_count: allModelIds.length,
      cosmos_reason_model_count: cosmosReasonModels.length,
      cosmos_reason_models: cosmosReasonModels
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown diagnostics failure';
    res.status(500).json({ error: `Diagnostics failure: ${message}` });
  }
});

diagRouter.get('/callable', async (_req: Request, res: Response) => {
  const apiKey = process.env.NVIDIA_API_KEY;
  const apiBase = getNimApiBase();
  const model = getConfiguredModel();

  if (!apiKey) {
    res.status(503).json({
      ok: false,
      callable: false,
      api_base: apiBase,
      model,
      error: 'Backend not configured: NVIDIA_API_KEY missing.'
    });
    return;
  }

  try {
    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Respond with exactly {"ok":true}' }
            ]
          }
        ],
        max_tokens: 16,
        temperature: 0
      })
    });

    if (!response.ok) {
      const raw = await response.text();
      const body = compact(raw).slice(0, 280);
      res.status(200).json({
        ok: false,
        callable: false,
        api_base: apiBase,
        model,
        status_code: response.status,
        error: `NVIDIA API error ${response.status}${body ? `: ${body}` : ''}`,
        remediation: remediationFor(response.status, raw, apiBase, model),
        references: DOCS
      });
      return;
    }

    res.status(200).json({
      ok: true,
      callable: true,
      api_base: apiBase,
      model,
      references: DOCS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown diagnostics failure';
    res.status(200).json({
      ok: false,
      callable: false,
      api_base: apiBase,
      model,
      error: `Diagnostics failure: ${message}`,
      remediation: [
        'Network or endpoint failure while probing runtime.',
        'Confirm NVIDIA_API_BASE is reachable from the backend environment.'
      ],
      references: DOCS
    });
  }
});
