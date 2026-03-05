/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server.js';
import { analyzeVideo, NimRequestError } from '../nim/client.js';

vi.mock('../nim/client.js', () => ({
  analyzeVideo: vi.fn().mockResolvedValue(
    '<think>Vehicle approaching fast.</think>{"events":[{"timestamp_seconds":5,"type":"near_miss","severity":"CRITICAL","reasoning":"High speed approach."}],"summary":"One near-miss."}'
  ),
  NimRequestError: class NimRequestError extends Error {
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
}));

describe('POST /analyze', () => {
  const app = createApp();
  const mockedAnalyzeVideo = vi.mocked(analyzeVideo);

  beforeEach(() => {
    mockedAnalyzeVideo.mockResolvedValue(
      '<think>Vehicle approaching fast.</think>{"events":[{"timestamp_seconds":5,"type":"near_miss","severity":"CRITICAL","reasoning":"High speed approach."}],"summary":"One near-miss."}'
    );
  });

  it('returns parsed events for a valid video_url', async () => {
    const res = await request(app)
      .post('/analyze')
      .send({ video_url: 'https://example.com/clip.mp4' });

    expect(res.status).toBe(200);
    expect(res.body.events).toHaveLength(1);
    expect(res.body.events[0].severity).toBe('CRITICAL');
    expect(res.body.summary).toBe('One near-miss.');
    expect(res.body.rawThink).toContain('Vehicle approaching');
  });

  it('returns 400 when video_url is missing', async () => {
    const res = await request(app).post('/analyze').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/video_url/);
  });

  it('returns 429 when NVIDIA API is rate limited', async () => {
    mockedAnalyzeVideo.mockRejectedValueOnce(new NimRequestError(429, '{"error":"too many requests"}', 'nvidia/cosmos-reason2-8b'));

    const res = await request(app)
      .post('/analyze')
      .send({ video_url: 'https://example.com/clip.mp4' });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('rate limited');
  });

  it('returns 503 when NVIDIA API key is missing', async () => {
    mockedAnalyzeVideo.mockRejectedValueOnce(new Error('NVIDIA_API_KEY not set'));

    const res = await request(app)
      .post('/analyze')
      .send({ video_url: 'https://example.com/clip.mp4' });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('NVIDIA_API_KEY');
  });
});
