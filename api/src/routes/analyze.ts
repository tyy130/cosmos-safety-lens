/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import { Router, type Request, type Response } from 'express';
import { analyzeVideo, NimRequestError } from '../nim/client.js';
import { parseNimResponse } from '../nim/parser.js';
import { getDemoResult, type CachedResult } from '../demo-cache.js';

export const analyzeRouter = Router();

function normalizeSeverity(value: string): 'CRITICAL' | 'WARNING' | 'INFO' {
  const normalized = value.trim().toUpperCase();
  if (normalized === 'HIGH' || normalized === 'CRITICAL') return 'CRITICAL';
  if (normalized === 'MEDIUM' || normalized === 'WARNING') return 'WARNING';
  return 'INFO';
}

function inferEventType(label: string): 'near_miss' | 'unsafe_behavior' | 'hazard' | 'pedestrian_risk' {
  const value = label.toLowerCase();
  if (value.includes('pedestrian')) return 'pedestrian_risk';
  if (value.includes('hazard')) return 'hazard';
  if (value.includes('unsafe')) return 'unsafe_behavior';
  return 'near_miss';
}

function normalizeDemoPayload(demo: CachedResult) {
  return {
    rawThink: demo.rawThink,
    summary: demo.summary,
    events: demo.events.map((event) => ({
      timestamp_seconds: event.time,
      type: inferEventType(event.label),
      severity: normalizeSeverity(event.severity),
      reasoning: event.description
    }))
  };
}

analyzeRouter.post('/', async (req: Request, res: Response) => {
  const { video_url } = req.body as Record<string, unknown>;

  if (!video_url || typeof video_url !== 'string') {
    res.status(400).json({ error: 'video_url is required' });
    return;
  }

  try {
    const startMs = Date.now();
    const raw = await analyzeVideo(video_url);
    const parsed = parseNimResponse(raw);

    res.json({
      ...parsed,
      duration_ms: Date.now() - startMs,
      video_url,
      demo_mode: false,
      inference_source: 'nvidia_nim'
    });
  } catch (error) {
    if (error instanceof NimRequestError) {
      // Fall back to demo cache on API access errors (404, 403, 503)
      if (error.status === 404 || error.status === 403 || error.status === 503) {
        const demo = getDemoResult(video_url);
        if (demo) {
          const normalized = normalizeDemoPayload(demo);
          res.json({
            ...normalized,
            video_url,
            duration_ms: 0,
            demo: true,
            demo_mode: true,
            inference_source: 'demo_cache'
          });
          return;
        }
      }
      const body = error.responseBody.replace(/\s+/g, ' ').trim().slice(0, 280);
      if (error.status === 429) {
        res.status(429).json({ error: `NVIDIA API rate limited (${error.model})${body ? `: ${body}` : ''}` });
        return;
      }
      res.status(502).json({ error: `NVIDIA API error ${error.status} (${error.model})${body ? `: ${body}` : ''}` });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unknown analysis failure';
    if (message.includes('NVIDIA_API_KEY not set')) {
      // Fall back to demo cache when no API key configured
      const demo = getDemoResult(video_url);
      if (demo) {
        const normalized = normalizeDemoPayload(demo);
        res.json({
          ...normalized,
          video_url,
          duration_ms: 0,
          demo: true,
          demo_mode: true,
          inference_source: 'demo_cache'
        });
        return;
      }
      res.status(503).json({ error: 'Backend not configured: NVIDIA_API_KEY missing.' });
      return;
    }

    res.status(500).json({ error: `Analysis failure: ${message}` });
  }
});
