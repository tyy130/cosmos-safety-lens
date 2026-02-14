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
 * Positive set: videos where a collision or imminent near-miss occurred.
 * Negative set: videos of normal driving with no collision/near-miss event.
 *
 * All URLs resolve publicly via HuggingFace CDN (HTTP 200, CORS: *).
 */
export const DEMO_CLIPS: DemoClip[] = [
  {
    id: 'clip-1',
    label: 'Near-Miss Collision',
    description: 'Dashcam capture of a collision or imminent near-miss event (Nexar positive sample)',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00002.mp4'
  },
  {
    id: 'clip-2',
    label: 'High-Severity Impact',
    description: 'Higher-severity collision event captured on dashcam in varied conditions (Nexar positive sample)',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/positive/00030.mp4'
  },
  {
    id: 'clip-3',
    label: 'Normal Driving Baseline',
    description: 'Standard urban driving scenario with no collision event — safety baseline for model comparison (Nexar negative sample)',
    url: 'https://huggingface.co/datasets/nexar-ai/nexar_collision_prediction/resolve/main/test-public/negative/01044.mp4'
  }
];
