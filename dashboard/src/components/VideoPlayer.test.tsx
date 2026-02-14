/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VideoPlayer } from './VideoPlayer';
import type { SafetyEvent } from '../types';

const MOCK_EVENTS: SafetyEvent[] = [
  { timestamp_seconds: 5, type: 'near_miss', severity: 'CRITICAL', reasoning: 'High speed approach' },
  { timestamp_seconds: 12, type: 'hazard', severity: 'WARNING', reasoning: 'Debris on road' }
];

describe('VideoPlayer', () => {
  it('renders event markers', () => {
    render(
      <VideoPlayer
        url="https://example.com/clip.mp4"
        events={MOCK_EVENTS}
        selectedEventIdx={null}
        onEventSelect={vi.fn()}
      />
    );
    const markers = screen.getAllByRole('button', { name: /event marker/i });
    expect(markers).toHaveLength(2);
  });

  it('calls onEventSelect when marker clicked', () => {
    const onSelect = vi.fn();
    render(
      <VideoPlayer
        url="https://example.com/clip.mp4"
        events={MOCK_EVENTS}
        selectedEventIdx={null}
        onEventSelect={onSelect}
      />
    );
    const markers = screen.getAllByRole('button', { name: /event marker/i });
    fireEvent.click(markers[0]);
    expect(onSelect).toHaveBeenCalledWith(0);
  });
});
