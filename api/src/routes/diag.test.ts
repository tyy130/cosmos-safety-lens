import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';

global.fetch = vi.fn();

describe('GET /diag/models', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NVIDIA_API_KEY = 'test-key';
  });

  it('returns cosmos reason model IDs from NVIDIA model catalog', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          { id: 'nvidia/cosmos-reason2-8b' },
          { id: 'nvidia/llama-3.3-nemotron' },
          { id: 'nvidia/cosmos-reason1-7b' }
        ]
      })
    });

    const res = await request(app).get('/diag/models');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.api_base).toBe('https://integrate.api.nvidia.com/v1');
    expect(res.body.cosmos_reason_model_count).toBe(2);
    expect(res.body.cosmos_reason_models).toEqual([
      'nvidia/cosmos-reason1-7b',
      'nvidia/cosmos-reason2-8b'
    ]);
  });

  it('returns 503 when NVIDIA_API_KEY is missing', async () => {
    delete process.env.NVIDIA_API_KEY;

    const res = await request(app).get('/diag/models');
    expect(res.status).toBe(503);
    expect(res.body.error).toContain('NVIDIA_API_KEY');
  });
});

describe('GET /diag/callable', () => {
  const app = createApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NVIDIA_API_KEY = 'test-key';
    process.env.NVIDIA_MODEL = 'nvidia/cosmos-reason2-8b';
    process.env.NVIDIA_API_BASE = 'https://integrate.api.nvidia.com/v1';
  });

  it('returns callable true when chat completion succeeds', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"ok":true}' } }] })
    });

    const res = await request(app).get('/diag/callable');
    expect(res.status).toBe(200);
    expect(res.body.callable).toBe(true);
    expect(res.body.model).toBe('nvidia/cosmos-reason2-8b');
    expect(res.body.references.apiExamples).toContain('docs.nvidia.com');
  });

  it('returns callable false with error details when model call fails', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '{"detail":"Function not found for account"}'
    });

    const res = await request(app).get('/diag/callable');
    expect(res.status).toBe(200);
    expect(res.body.callable).toBe(false);
    expect(res.body.status_code).toBe(404);
    expect(res.body.error).toContain('NVIDIA API error 404');
    expect(res.body.remediation.length).toBeGreaterThan(0);
    expect(res.body.references.forumStatus).toContain('forums.developer.nvidia.com');
  });
});
