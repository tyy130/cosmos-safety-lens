/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
const NIM_ENDPOINT = 'https://integrate.api.nvidia.com/v1/chat/completions';

const SAFETY_PROMPT = `You are a physical AI safety reasoning system analyzing dashcam footage.
Identify all safety-critical events in this video. For each event provide:
- timestamp_seconds: when it occurs (number)
- type: one of "near_miss" | "unsafe_behavior" | "hazard" | "pedestrian_risk"
- severity: one of "CRITICAL" | "WARNING" | "INFO"
- reasoning: physical explanation covering trajectories, spatial relationships, reaction times, contributing factors

After your reasoning chain, output a JSON object: {"events": [...], "summary": "..."}
If no events are detected, output {"events": [], "summary": "No safety events detected."}`;

export async function analyzeVideo(videoUrl: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set');

  const body = {
    model: 'nvidia/cosmos-reason2-8b',
    messages: [
      {
        role: 'system',
        content: '/no_think'
      },
      {
        role: 'user',
        content: [
          {
            type: 'video_url',
            video_url: { url: videoUrl }
          },
          {
            type: 'text',
            text: SAFETY_PROMPT
          }
        ]
      }
    ],
    max_tokens: 4096,
    temperature: 0.0
  };

  const response = await fetch(NIM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NIM API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
