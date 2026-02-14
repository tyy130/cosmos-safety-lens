/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ReasoningPanel } from './ReasoningPanel';
import type { AnalysisResult } from '../types';

const MOCK_RESULT: AnalysisResult = {
  video_url: 'https://example.com/clip.mp4',
  summary: 'One critical near-miss detected.',
  rawThink: 'Vehicle A was traveling at 50mph approaching the intersection.',
  duration_ms: 4200,
  events: [
    { timestamp_seconds: 5, type: 'near_miss', severity: 'CRITICAL', reasoning: 'Insufficient stopping distance.' }
  ]
};

describe('ReasoningPanel', () => {
  it('shows summary', () => {
    render(<ReasoningPanel onEventSelect={vi.fn()} result={MOCK_RESULT} selectedEventIdx={null} />);
    expect(screen.getByText('One critical near-miss detected.')).toBeTruthy();
  });

  it('shows selected event reasoning', () => {
    render(<ReasoningPanel onEventSelect={vi.fn()} result={MOCK_RESULT} selectedEventIdx={0} />);
    expect(screen.getByText('Insufficient stopping distance.')).toBeTruthy();
  });

  it('shows full think trace when no event selected', () => {
    render(<ReasoningPanel onEventSelect={vi.fn()} result={MOCK_RESULT} selectedEventIdx={null} />);
    expect(screen.getByText(/Vehicle A was traveling/)).toBeTruthy();
  });

  it('shows severity badge for selected event', () => {
    render(<ReasoningPanel onEventSelect={vi.fn()} result={MOCK_RESULT} selectedEventIdx={0} />);
    expect(screen.getByText('CRITICAL')).toBeTruthy();
  });
});
