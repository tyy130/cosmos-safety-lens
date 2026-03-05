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
import { useEffect, useState } from 'react';
import type { AnalysisResult, DemoClip, RuntimeReadiness } from './types';
import { analyzeVideo, getRuntimeReadiness } from './api/client';
import { VideoPlayer } from './components/VideoPlayer';
import { ReasoningPanel } from './components/ReasoningPanel';
import { DemoSelector } from './components/DemoSelector';

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedEventIdx, setSelectedEventIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<RuntimeReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(true);
  const [readinessError, setReadinessError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setReadinessLoading(true);
      setReadinessError(null);
      try {
        const data = await getRuntimeReadiness();
        if (!active) return;
        setReadiness(data);
      } catch (e) {
        if (!active) return;
        setReadiness(null);
        setReadinessError(e instanceof Error ? e.message : 'Runtime readiness check failed.');
      } finally {
        if (active) setReadinessLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const analyzeBlocked = readinessLoading || readiness?.callable === false || Boolean(readinessError);
  const analyzeBlockReason = readinessLoading
    ? 'Checking Cosmos Reason 2 runtime...'
    : readinessError
      ? readinessError
      : (readiness?.error ?? null);
  const readinessRemediation = readiness?.remediation ?? [];

  async function handleAnalyze(url: string) {
    if (analyzeBlocked) {
      setError(analyzeBlockReason ?? 'Analyze is blocked until runtime is ready.');
      return;
    }
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

      {analyzeBlocked && (
        <div className="error preflight-error">
          Runtime not ready: {analyzeBlockReason ?? 'Cosmos Reason 2 is currently not callable.'}
          {readiness && (
            <div className="preflight-meta">
              <div><strong>Model:</strong> {readiness.model}</div>
              <div><strong>API base:</strong> {readiness.api_base}</div>
            </div>
          )}
          {readinessRemediation.length > 0 && (
            <ul className="preflight-steps">
              {readinessRemediation.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          )}
          {readiness?.references?.apiExamples && (
            <div className="preflight-links">
              <a href={readiness.references.apiExamples} target="_blank" rel="noopener noreferrer">Cosmos Reason2 API Docs</a>
              {readiness.references.localDeploy && (
                <a href={readiness.references.localDeploy} target="_blank" rel="noopener noreferrer">Deploy Instructions</a>
              )}
              {readiness.references.forumStatus && (
                <a href={readiness.references.forumStatus} target="_blank" rel="noopener noreferrer">NVIDIA Forum Thread</a>
              )}
            </div>
          )}
        </div>
      )}

      <DemoSelector disabled={analyzeBlocked} onSelect={(clip: DemoClip) => {
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
        <button onClick={() => handleAnalyze(videoUrl)} disabled={loading || !videoUrl || analyzeBlocked}>
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
          <a
            className="logo-tile nvidia"
            href="https://www.nvidia.com/en-us/ai/cosmos/"
            target="_blank"
            rel="noopener noreferrer"
            title="NVIDIA Cosmos"
          >
            <img src="/logos/nvidia.png" alt="NVIDIA" />
            <div>
              <strong>NVIDIA Cosmos</strong>
              <span>Reason 2 Inference</span>
            </div>
          </a>
          <a
            className="logo-tile nexar"
            href="https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction"
            target="_blank"
            rel="noopener noreferrer"
            title="Nexar Collision Prediction Dataset"
          >
            <img src="/logos/nexar.png" alt="Nexar" />
            <div>
              <strong>Nexar Dataset</strong>
              <span>Collision Prediction Clips</span>
            </div>
          </a>
        </div>
      </footer>
    </div>
  );
}
