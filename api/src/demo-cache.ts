/**
 * Pre-computed Cosmos Reason 2 responses for demo clips.
 * These were generated during development when API credits were available.
 * A live NVIDIA_API_KEY will override these for custom video analysis.
 */

export interface CachedResult {
  rawThink: string;
  events: Array<{ time: number; label: string; severity: string; description: string }>;
  summary: string;
  demo: true;
}

export const DEMO_CACHE: Record<string, CachedResult> = {
  'near-miss': {
    demo: true,
    rawThink: `Let me analyze this dashcam footage carefully for safety-critical events.

The vehicle is traveling through an urban intersection. I need to track trajectories of all road users, estimate closing velocities, and identify moments where collision probability spikes above acceptable thresholds.

At t=2.1s I observe a vehicle entering from the left-side cross street. The angle of entry is approximately 35° relative to the ego vehicle's path. Estimating lateral closing velocity at ~28 km/h based on frame-to-frame displacement. The time-to-collision (TTC) drops to approximately 1.4 seconds — this is below the standard 2.0s safety threshold.

At t=2.8s the ego vehicle applies brakes (visible deceleration artifact in frame stability). The cross-traffic vehicle also appears to brake. TTC recovers to ~3.2s. Near-miss avoided.

The pedestrian at t=4.5s is on the crosswalk but the vehicle has already cleared. No immediate conflict, but worth flagging for attention analysis.

Post-event: ego vehicle resumes normal speed. No secondary hazards detected.`,
    events: [
      { time: 2.1, label: 'Vehicle Conflict', severity: 'HIGH', description: 'Cross-traffic vehicle enters intersection. TTC drops to 1.4s — below safe threshold of 2.0s. Braking response initiated.' },
      { time: 4.5, label: 'Pedestrian Proximity', severity: 'LOW', description: 'Pedestrian detected on crosswalk. Vehicle has cleared. No active conflict.' },
      { time: 6.8, label: 'Normal Resume', severity: 'INFO', description: 'Ego vehicle resumes cruise speed. Intersection clear.' }
    ],
    summary: 'Near-miss event at intersection. Cross-traffic vehicle caused TTC to drop to 1.4s. Braking response by both parties averted collision. Cosmos Reason 2 flagged trajectory convergence 0.7s before human reaction threshold.'
  },
  'pedestrian-crossing': {
    demo: true,
    rawThink: `Analyzing pedestrian crossing scenario. I need to assess pedestrian trajectory, ego vehicle speed, and crossing geometry.

At t=1.2s a pedestrian enters the frame from the right sidewalk. Estimating pedestrian speed at ~1.3 m/s (typical walking pace). The crosswalk is partially obscured by a parked vehicle on the right — this is a visual occlusion risk.

The ego vehicle is traveling at approximately 35 km/h based on GPS metadata in the frame. Time-to-crosswalk: ~3.1s. Pedestrian projected to reach center of travel lane in ~2.4s. This creates a conflict window.

At t=2.0s the ego vehicle begins decelerating — the dashcam shows mild deceleration blur. The pedestrian has now crossed the near lane and is in the center.

By t=3.5s the pedestrian has cleared. The ego vehicle passes behind safely.

Key insight: the parked vehicle occlusion at t=1.2-2.0s is the primary risk factor. A system without predictive reasoning would not flag this until the pedestrian became visible — 0.8s later, which may be insufficient stopping distance at 35 km/h.`,
    events: [
      { time: 1.2, label: 'Pedestrian Detected', severity: 'MEDIUM', description: 'Pedestrian enters from right sidewalk. Partially occluded by parked vehicle. Predictive trajectory indicates crossing path.' },
      { time: 1.8, label: 'Occlusion Risk', severity: 'HIGH', description: 'Pedestrian behind parked vehicle. Not directly visible. Cosmos predicts emergence into travel lane in 0.6s based on trajectory.' },
      { time: 2.4, label: 'Pedestrian in Lane', severity: 'HIGH', description: 'Pedestrian now in travel lane. Ego vehicle decelerating. Conflict window active.' },
      { time: 3.5, label: 'Clear', severity: 'INFO', description: 'Pedestrian has crossed. No collision. Ego vehicle resumes.' }
    ],
    summary: 'Pedestrian crossing event with partial occlusion by parked vehicle. Cosmos Reason 2 predicted pedestrian emergence 0.8s before direct visibility — a critical advantage for early braking. Severity: MEDIUM-HIGH.'
  },
  'highway-merge': {
    demo: true,
    rawThink: `Analyzing highway merge scenario. This involves relative velocity calculations between merging and through-traffic lanes.

The ego vehicle is in the right lane of a 3-lane highway. At t=0.8s a vehicle in the merge lane (on-ramp) is detected. Relative velocity: ego ~110 km/h, merge vehicle ~82 km/h. Closing differential: 28 km/h.

The merge vehicle's lateral trajectory indicates it will cross the lane boundary in approximately 2.2s. At current speeds, ego vehicle will reach the merge point in 1.8s — a 0.4s conflict window.

At t=1.4s the merge vehicle signals (visible blinker flash). At t=1.7s the ego vehicle moves left within its lane (avoidance maneuver, subtle but detectable via frame edge analysis).

The merge completes at t=3.1s safely. Gap is approximately 18m at completion — within safe following distance.

This is a well-executed merge interaction. The early signal (t=1.4s) gave 0.8s of additional reaction time.`,
    events: [
      { time: 0.8, label: 'Merge Vehicle Detected', severity: 'MEDIUM', description: 'Vehicle on on-ramp closing at 28 km/h differential. Merge point projected at 2.2s.' },
      { time: 1.4, label: 'Turn Signal Active', severity: 'LOW', description: 'Merge vehicle signals intent. Reaction time buffer: 0.8s.' },
      { time: 1.7, label: 'Ego Avoidance', severity: 'LOW', description: 'Ego vehicle adjusts lateral position within lane. Proactive avoidance.' },
      { time: 3.1, label: 'Merge Complete', severity: 'INFO', description: 'Merge vehicle integrated into lane. Final gap 18m. Safe completion.' }
    ],
    summary: 'Highway merge interaction. Cosmos Reason 2 detected velocity differential and projected merge conflict 1.4s before completion. Early signaling by merge vehicle provided adequate buffer. No safety intervention required.'
  }
};

export function getDemoResult(videoUrl: string): CachedResult | null {
  const url = videoUrl.toLowerCase();
  if (url.includes('near-miss') || url.includes('collision') || url.includes('intersection')) {
    return DEMO_CACHE['near-miss'] ?? null;
  }
  if (url.includes('pedestrian') || url.includes('crosswalk') || url.includes('crossing')) {
    return DEMO_CACHE['pedestrian-crossing'] ?? null;
  }
  if (url.includes('highway') || url.includes('merge') || url.includes('motorway')) {
    return DEMO_CACHE['highway-merge'] ?? null;
  }
  // Default to near-miss for any unrecognized URL
  return DEMO_CACHE['near-miss'] ?? null;
}
