/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/
import { describe, it, expect } from 'vitest';
import { parseNimResponse } from './parser.js';

const SAMPLE_RESPONSE = `<think>
At 00:03, vehicle A enters the intersection at approximately 45mph.
The cross-traffic vehicle B has right of way. Vehicle A's stopping
distance at this speed is ~40m but only 15m is available.
</think>
{"events":[{"timestamp_seconds":3,"type":"near_miss","severity":"CRITICAL","reasoning":"Vehicle A entered intersection with insufficient stopping distance. At 45mph, reaction + braking distance exceeds available gap by ~25m."}],"summary":"One critical near-miss detected at intersection."}`;

describe('parseNimResponse', () => {
  it('extracts think block', () => {
    const result = parseNimResponse(SAMPLE_RESPONSE);
    expect(result.rawThink).toContain('vehicle A enters the intersection');
  });

  it('parses events array', () => {
    const result = parseNimResponse(SAMPLE_RESPONSE);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].timestamp_seconds).toBe(3);
    expect(result.events[0].type).toBe('near_miss');
    expect(result.events[0].severity).toBe('CRITICAL');
  });

  it('parses summary', () => {
    const result = parseNimResponse(SAMPLE_RESPONSE);
    expect(result.summary).toBe('One critical near-miss detected at intersection.');
  });

  it('handles response with no think block', () => {
    const noThink = '{"events":[],"summary":"No events."}';
    const result = parseNimResponse(noThink);
    expect(result.rawThink).toBe('');
    expect(result.events).toHaveLength(0);
  });

  it('handles malformed JSON gracefully', () => {
    const malformed = '<think>some reasoning</think>not valid json';
    const result = parseNimResponse(malformed);
    expect(result.events).toEqual([]);
    expect(result.summary).toBe('Unable to parse structured response.');
    expect(result.rawThink).toContain('some reasoning');
  });
});
