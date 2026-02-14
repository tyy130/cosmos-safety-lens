/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import { useRef, useEffect } from 'react';
import type { SafetyEvent } from '../types';

const SEVERITY_COLOR = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6'
} as const;

interface Props {
  url: string;
  events: SafetyEvent[];
  selectedEventIdx: number | null;
  onEventSelect: (idx: number) => void;
}

export function VideoPlayer({ url, events, selectedEventIdx, onEventSelect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (selectedEventIdx !== null && videoRef.current) {
      videoRef.current.currentTime = events[selectedEventIdx].timestamp_seconds;
    }
  }, [selectedEventIdx, events]);

  const rawDuration = videoRef.current?.duration;
  const duration = (rawDuration && !isNaN(rawDuration)) ? rawDuration : 60;

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={url}
        controls
        className="video-element"
        crossOrigin="anonymous"
      />
      <div className="event-timeline" role="region" aria-label="Event timeline">
        {events.map((event, idx) => (
          <button
            key={idx}
            aria-label={`event marker ${idx + 1}: ${event.severity} at ${event.timestamp_seconds}s`}
            className={`event-marker ${event.severity.toLowerCase()} ${selectedEventIdx === idx ? 'selected' : ''}`}
            style={{
              left: `${(event.timestamp_seconds / duration) * 100}%`,
              background: SEVERITY_COLOR[event.severity]
            }}
            onClick={() => onEventSelect(idx)}
            title={`${event.severity}: ${event.type} at ${event.timestamp_seconds}s`}
          />
        ))}
      </div>
    </div>
  );
}
