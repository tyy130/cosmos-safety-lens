/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

// dashboard/src/App.tsx
import { useState } from 'react';
import type { AnalysisResult, DemoClip } from './types';
import { analyzeVideo } from './api/client';
import { VideoPlayer } from './components/VideoPlayer';
import { ReasoningPanel } from './components/ReasoningPanel';
import { DemoSelector } from './components/DemoSelector';

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);
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
      <DemoSelector onSelect={(clip: DemoClip) => {
        setVideoUrl(clip.url);
        handleAnalyze(clip.url);
      }} />
      <div className="url-input">
        <input
          type="text"
          placeholder="Or paste a dashcam video URL..."
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
          <VideoPlayer
            url={result.video_url}
            events={result.events}
            selectedEventIdx={selectedEventIdx}
            onEventSelect={setSelectedEventIdx}
          />
          <ReasoningPanel
            result={result}
            selectedEventIdx={selectedEventIdx}
            onEventSelect={setSelectedEventIdx}
          />
        </div>
      )}
      <footer className="attribution">
        <span className="attribution-label">Powered by</span>
        <div className="attribution-logos">
          <a href="https://www.nvidia.com/en-us/ai/cosmos/" target="_blank" rel="noopener noreferrer" title="NVIDIA Cosmos">
            <img src="/logos/nvidia.png" alt="NVIDIA" />
          </a>
          <a href="https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction" target="_blank" rel="noopener noreferrer" title="Nexar Collision Prediction Dataset">
            <img src="/logos/nexar.png" alt="Nexar" />
          </a>
        </div>
      </footer>
    </div>
  );
}
