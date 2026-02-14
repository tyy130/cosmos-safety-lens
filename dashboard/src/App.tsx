/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import { useState } from 'react';
import type { AnalysisResult } from './types.js';
import { analyzeVideo, getDemoClips as _getDemoClips } from './api/client.js';

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [_selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze(url: string) {
    setLoading(true);
    setError(null);
    setResult(null);
    setSelectedEventIdx(null);
    try {
      const data = await analyzeVideo(url);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Cosmos Safety Lens</h1>
        <p>Physical AI reasoning for dashcam footage — powered by NVIDIA Cosmos Reason 2</p>
      </header>
      <div className="url-input">
        <input
          type="text"
          placeholder="Paste a dashcam video URL..."
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
        />
        <button onClick={() => handleAnalyze(videoUrl)} disabled={loading || !videoUrl}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="results">
          <p>Analysis complete: {result.events.length} event(s) detected</p>
          <p>{result.summary}</p>
        </div>
      )}
    </div>
  );
}
