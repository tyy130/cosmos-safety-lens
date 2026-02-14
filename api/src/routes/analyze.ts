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
import { analyzeVideo } from '../nim/client.js';
import { parseNimResponse } from '../nim/parser.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', async (req: Request, res: Response) => {
  const { video_url } = req.body as Record<string, unknown>;

  if (!video_url || typeof video_url !== 'string') {
    res.status(400).json({ error: 'video_url is required' });
    return;
  }

  const startMs = Date.now();
  const raw = await analyzeVideo(video_url);
  const parsed = parseNimResponse(raw);

  res.json({
    ...parsed,
    duration_ms: Date.now() - startMs,
    video_url
  });
});
