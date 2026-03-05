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
import { getDemoResult } from '../demo-cache.js';

export const analyzeRouter = Router();

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
      video_url
    });
  } catch (error) {
    if (error instanceof NimRequestError) {
      // Fall back to demo cache on API access errors (404, 403, 503)
      if (error.status === 404 || error.status === 403 || error.status === 503) {
        const demo = getDemoResult(video_url);
        if (demo) {
          res.json({ ...demo, video_url, duration_ms: 0, demo_mode: true });
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
        res.json({ ...demo, video_url, duration_ms: 0, demo_mode: true });
        return;
      }
      res.status(503).json({ error: 'Backend not configured: NVIDIA_API_KEY missing.' });
      return;
    }

    res.status(500).json({ error: `Analysis failure: ${message}` });
  }
});
