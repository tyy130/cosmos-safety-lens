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

const DEMO_CLIPS: DemoClip[] = [
  { id: 'clip-1', label: 'Near-Miss Collision', description: 'Nexar positive sample — imminent near-miss event', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00002.mp4' },
  { id: 'clip-2', label: 'High-Severity Impact', description: 'Nexar positive sample — higher-severity collision', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00030.mp4' },
  { id: 'clip-3', label: 'Normal Driving', description: 'Nexar negative sample — standard urban driving baseline', url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01044.mp4' },
];

interface Props {
  onSelect: (clip: DemoClip) => void;
}

export function DemoSelector({ onSelect }: Props) {
  return (
    <div className="demo-selector">
      <h3>Try a demo clip</h3>
      <div className="demo-clips">
        {DEMO_CLIPS.map(clip => (
          <button
            key={clip.id}
            className="demo-clip-btn"
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
