/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import type { AnalysisResult, DemoClip } from '../types.js';

const BASE = import.meta.env.VITE_API_URL ?? 'https://cosmos-safety-lens-api-production.up.railway.app';

export async function analyzeVideo(videoUrl: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_url: videoUrl })
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

export async function getDemoClips(): Promise<DemoClip[]> {
  const res = await fetch(`${BASE}/demo-clips`);
  if (!res.ok) throw new Error('Failed to load demo clips');
  return res.json();
}
