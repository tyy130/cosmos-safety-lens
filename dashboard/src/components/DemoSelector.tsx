/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

// dashboard/src/components/DemoSelector.tsx
import type { DemoClip } from '../types';

const CORE_CLIPS: DemoClip[] = [
  { id: 'clip-1', label: 'Near-Miss Collision', description: 'Nexar positive sample — imminent near-miss event', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00002.mp4' },
  { id: 'clip-2', label: 'High-Severity Impact', description: 'Nexar positive sample — higher-severity collision', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00030.mp4' },
  { id: 'clip-3', label: 'Normal Driving', description: 'Nexar negative sample — standard urban driving baseline', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01044.mp4' },
];

const CHALLENGE_CLIPS: DemoClip[] = [
  { id: 'clip-4', label: 'Challenge: Night Density', description: 'Ultra-low-light scene with dense night traffic interactions', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00161.mp4' },
  { id: 'clip-5', label: 'Challenge: Glare Burst', description: 'Strong glare and fast scene transitions', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00075.mp4' },
  { id: 'clip-6', label: 'Challenge: Occlusion', description: 'Partially obscured conflict dynamics', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00137.mp4' },
  { id: 'clip-7', label: 'Challenge: High Motion', description: 'Rapid motion + late scene disambiguation', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00231.mp4' },
  { id: 'clip-8', label: 'Challenge: Baseline Complex A', description: 'Non-collision baseline with dense context', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01056.mp4' },
  { id: 'clip-9', label: 'Challenge: Baseline Complex B', description: 'Normal driving with harder visual conditions', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01139.mp4' },
  { id: 'clip-10', label: 'Challenge: Baseline Complex C', description: 'Baseline clip with bright/saturated lighting', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01244.mp4' },
  { id: 'clip-11', label: 'Challenge: Baseline Complex D', description: 'Baseline clip with crowded roadway context', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01347.mp4' }
];

interface Props {
  onSelect: (clip: DemoClip) => void;
  disabled?: boolean;
}

export function DemoSelector({ onSelect, disabled = false }: Props) {
  return (
    <div className="demo-selector">
      <h3>Try a demo clip</h3>
      <div className="demo-clips">
        {CORE_CLIPS.map(clip => (
          <button
            key={clip.id}
            className="demo-clip-btn"
            disabled={disabled}
            onClick={() => onSelect(clip)}
          >
            <strong>{clip.label}</strong>
            <span>{clip.description}</span>
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: '0.9rem' }}>Challenge library</h3>
      <div className="demo-clips">
        {CHALLENGE_CLIPS.map(clip => (
          <button
            key={clip.id}
            className="demo-clip-btn"
            disabled={disabled}
            onClick={() => onSelect(clip)}
          >
            <strong>{clip.label}</strong>
            <span>{clip.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
