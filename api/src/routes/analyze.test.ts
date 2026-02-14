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

vi.mock('../nim/client.js', () => ({
  analyzeVideo: vi.fn().mockResolvedValue(
    '<think>Vehicle approaching fast.</think>{"events":[{"timestamp_seconds":5,"type":"near_miss","severity":"CRITICAL","reasoning":"High speed approach."}],"summary":"One near-miss."}'
  )
}));

describe('POST /analyze', () => {
  const app = createApp();

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
});
