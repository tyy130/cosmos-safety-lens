/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

export interface DemoClip {
  id: string;
  label: string;
  description: string;
  url: string;
}

/**
 * Real dashcam video clips from the Nexar Collision Prediction Dataset
 * (https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction)
 * License: nexar-open-data-license
 *
 * All URLs resolve publicly via HuggingFace CDN (HTTP 200).
 */
export const DEMO_CLIPS: DemoClip[] = [
  {
    id: 'clip-1',
    label: 'Near-Miss Collision',
    description: 'Dashcam capture of a collision or imminent near-miss event (Nexar positive sample)',
    url: '/clips/00002.mp4'
  },
  {
    id: 'clip-2',
    label: 'High-Severity Impact',
    description: 'Higher-severity collision event captured on dashcam in varied conditions (Nexar positive sample)',
    url: '/clips/00030.mp4'
  },
  {
    id: 'clip-3',
    label: 'Normal Driving Baseline',
    description: 'Standard urban driving scenario with no collision event — safety baseline for model comparison (Nexar negative sample)',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01044.mp4'
  },
  {
    id: 'clip-4',
    label: 'Challenge: Night Density',
    description: 'Ultra-low-light scene with dense night traffic interactions',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00161.mp4'
  },
  {
    id: 'clip-5',
    label: 'Challenge: Glare Burst',
    description: 'Strong glare and fast scene transitions',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00075.mp4'
  },
  {
    id: 'clip-6',
    label: 'Challenge: Occlusion',
    description: 'Partially obscured conflict dynamics',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00137.mp4'
  },
  {
    id: 'clip-7',
    label: 'Challenge: High Motion',
    description: 'Rapid motion + late scene disambiguation',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00231.mp4'
  },
  {
    id: 'clip-8',
    label: 'Challenge: Baseline Complex A',
    description: 'Non-collision baseline with dense context',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01056.mp4'
  },
  {
    id: 'clip-9',
    label: 'Challenge: Baseline Complex B',
    description: 'Normal driving with harder visual conditions',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01139.mp4'
  },
  {
    id: 'clip-10',
    label: 'Challenge: Baseline Complex C',
    description: 'Baseline clip with bright/saturated lighting',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01244.mp4'
  },
  {
    id: 'clip-11',
    label: 'Challenge: Baseline Complex D',
    description: 'Baseline clip with crowded roadway context',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01347.mp4'
  }
];
