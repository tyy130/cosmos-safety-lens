/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import express from 'express';
import cors from 'cors';
import { analyzeRouter } from './routes/analyze.js';
import { DEMO_CLIPS } from './demo/clips.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use('/analyze', analyzeRouter);
  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/demo-clips', (_req, res) => res.json(DEMO_CLIPS));
  return app;
}
