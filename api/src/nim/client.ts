/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
const DEFAULT_NIM_API_BASE = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_MODELS = ['nvidia/cosmos-reason2-8b'];

const SAFETY_PROMPT = `You are a physical AI safety reasoning system analyzing dashcam footage.
Identify all safety-critical events in this video. For each event provide:
- timestamp_seconds: when it occurs (number)
- type: one of "near_miss" | "unsafe_behavior" | "hazard" | "pedestrian_risk"
- severity: one of "CRITICAL" | "WARNING" | "INFO"
- reasoning: physical explanation covering trajectories, spatial relationships, reaction times, contributing factors

After your reasoning chain, output a JSON object: {"events": [...], "summary": "..."}
If no events are detected, output {"events": [], "summary": "No safety events detected."}`;

export class NimRequestError extends Error {
  status: number;
  responseBody: string;
  model: string;

  constructor(status: number, responseBody: string, model: string) {
    super(`NIM API error ${status} (${model})`);
    this.name = 'NimRequestError';
    this.status = status;
    this.responseBody = responseBody;
    this.model = model;
  }
}

function getModelCandidates(): string[] {
  const envRaw = process.env.NVIDIA_MODELS ?? process.env.NVIDIA_MODEL;
  if (!envRaw) return DEFAULT_MODELS;
  const models = envRaw.split(',').map(item => item.trim()).filter(Boolean);
  return models.length > 0 ? models : DEFAULT_MODELS;
}

function getNimApiBase(): string {
  const fromEnv = process.env.NVIDIA_API_BASE?.trim();
  const base = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_NIM_API_BASE;
  return base.replace(/\/+$/, '');
}

function isModelUnavailable(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  const compact = body.replace(/\s+/g, ' ').toLowerCase();
  return compact.includes('not found for account') || compact.includes('unknown model') || compact.includes('invalid model');
}

function buildRequestBody(videoUrl: string, model: string) {
  return {
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'video_url',
            video_url: { url: videoUrl }
          },
          {
            type: 'text',
            text: SAFETY_PROMPT
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.0
  };
}

async function tryModel(apiKey: string, videoUrl: string, model: string): Promise<string> {
  const response = await fetch(`${getNimApiBase()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildRequestBody(videoUrl, model))
  });

  if (response.ok) {
    const data = await response.json();
    return data.choices[0].message.content;
  }

  const text = await response.text();
  throw new NimRequestError(response.status, text, model);
}

async function fetchReasonModelsFromCatalog(apiKey: string): Promise<string[]> {
  const response = await fetch(`${getNimApiBase()}/models`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  if (!response.ok) return [];

  const payload = await response.json() as { data?: Array<{ id?: string }> };
  const ids = Array.isArray(payload.data)
    ? payload.data.map(item => item.id).filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];

  const reasonModels = ids.filter(id => id.toLowerCase().includes('cosmos-reason2'));
  const preferred = ['nvidia/cosmos-reason2-8b', 'nvidia/cosmos-reason2-2b'];
  const preferredFirst = preferred.filter(model => reasonModels.includes(model));
  const remaining = reasonModels.filter(model => !preferredFirst.includes(model)).sort();
  return [...preferredFirst, ...remaining];
}

export async function analyzeVideo(videoUrl: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set');
  const attempted = new Set<string>();

  const tryModels = async (
    models: string[],
    initialLastError: NimRequestError | null
  ): Promise<{ result: string | null; lastError: NimRequestError | null }> => {
    let lastError = initialLastError;
    for (const model of models) {
      if (attempted.has(model)) continue;
      attempted.add(model);
      try {
        return { result: await tryModel(apiKey, videoUrl, model), lastError };
      } catch (error) {
        if (!(error instanceof NimRequestError)) throw error;
        lastError = error;
        if (!isModelUnavailable(error.status, error.responseBody)) {
          throw error;
        }
      }
    }
    return { result: null, lastError };
  };

  const primaryAttempt = await tryModels(getModelCandidates(), null);
  if (primaryAttempt.result) return primaryAttempt.result;

  if (primaryAttempt.lastError && isModelUnavailable(primaryAttempt.lastError.status, primaryAttempt.lastError.responseBody)) {
    const catalogModels = await fetchReasonModelsFromCatalog(apiKey);
    if (catalogModels.length === 0) {
      throw new NimRequestError(
        404,
        'No Cosmos Reason models were returned by /v1/models for this NVIDIA_API_KEY.',
        'catalog'
      );
    }
    const catalogAttempt = await tryModels(catalogModels, primaryAttempt.lastError);
    if (catalogAttempt.result) return catalogAttempt.result;
    throw catalogAttempt.lastError ?? new Error('No compatible NVIDIA model available');
  }

  throw primaryAttempt.lastError ?? new Error('No compatible NVIDIA model available');
}
