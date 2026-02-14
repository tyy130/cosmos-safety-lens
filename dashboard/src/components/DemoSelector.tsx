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
import { useEffect, useState } from 'react';
import type { DemoClip } from '../types';
import { getDemoClips } from '../api/client';

interface Props {
  onSelect: (clip: DemoClip) => void;
}

export function DemoSelector({ onSelect }: Props) {
  const [clips, setClips] = useState<DemoClip[]>([]);

  useEffect(() => {
    getDemoClips().then(setClips).catch(console.error);
  }, []);

  if (clips.length === 0) return null;

  return (
    <div className="demo-selector">
      <h3>Try a demo clip</h3>
      <div className="demo-clips">
        {clips.map(clip => (
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
