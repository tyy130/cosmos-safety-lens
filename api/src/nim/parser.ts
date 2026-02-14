/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
export interface ParsedEvent {
  timestamp_seconds: number;
  type: 'near_miss' | 'unsafe_behavior' | 'hazard' | 'pedestrian_risk';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  reasoning: string;
}

export interface ParsedResponse {
  rawThink: string;
  events: ParsedEvent[];
  summary: string;
}

export function parseNimResponse(raw: string): ParsedResponse {
  // Extract <think> block
  const thinkMatch = raw.match(/<think>([\s\S]*?)<\/think>/);
  const rawThink = thinkMatch ? thinkMatch[1]!.trim() : '';

  // Extract JSON — everything after the closing </think> tag, or the whole string
  const jsonStr = raw.replace(/<think>[\s\S]*?<\/think>/, '').trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      rawThink,
      events: parsed.events ?? [],
      summary: parsed.summary ?? ''
    };
  } catch {
    return {
      rawThink,
      events: [],
      summary: 'Unable to parse structured response.'
    };
  }
}
