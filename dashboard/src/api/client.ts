/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import type { AnalysisResult, DemoClip, RuntimeReadiness } from '../types.js';

const BASE = import.meta.env.VITE_API_URL ?? 'https://cosmos-safety-lens-api-production.up.railway.app';

function normalizeServerError(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);
}

export async function analyzeVideo(videoUrl: string): Promise<AnalysisResult> {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video_url: videoUrl })
  });
  if (!res.ok) {
    let detail = '';
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();

    try {
      if (contentType.includes('application/json')) {
        const payload = await res.json();
        if (payload && typeof payload === 'object' && typeof payload.error === 'string') {
          detail = payload.error;
        } else {
          detail = JSON.stringify(payload);
        }
      } else {
        detail = await res.text();
      }
    } catch {
      detail = '';
    }

    const normalized = detail ? normalizeServerError(detail) : '';
    throw new Error(normalized ? `Analysis failed (${res.status}): ${normalized}` : `Analysis failed (${res.status})`);
  }
  return res.json();
}

export async function getDemoClips(): Promise<DemoClip[]> {
  const res = await fetch(`${BASE}/demo-clips`);
  if (!res.ok) throw new Error('Failed to load demo clips');
  return res.json();
}

export async function getRuntimeReadiness(): Promise<RuntimeReadiness> {
  const res = await fetch(`${BASE}/diag/callable`);
  let payload: RuntimeReadiness | null = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail = payload?.error ? normalizeServerError(payload.error) : `Diagnostics failed (${res.status})`;
    throw new Error(detail);
  }

  if (!payload) throw new Error('Diagnostics failed: empty response');
  return payload;
}
