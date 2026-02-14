/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

export interface SafetyEvent {
  timestamp_seconds: number;
  type: 'near_miss' | 'unsafe_behavior' | 'hazard' | 'pedestrian_risk';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reasoning: string;
}

export interface AnalysisResult {
  events: SafetyEvent[];
  summary: string;
  rawThink: string;
  duration_ms: number;
  video_url: string;
}

export interface DemoClip {
  id: string;
  label: string;
  description: string;
  url: string;
}
