/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import { useRef, useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { SafetyEvent } from '../types';

const SEVERITY_COLOR = {
  CRITICAL: '#ef4444',
  WARNING: '#f59e0b',
  INFO: '#3b82f6'
} as const;
const TIMELINE_PAD_PX = 18;
const EVENT_PREROLL_SECONDS = 1.25;
const EVENT_WINDOW_SECONDS = 2.6;

interface Props {
  url: string;
  events: SafetyEvent[];
  selectedEventIdx: number | null;
  onEventSelect: (idx: number) => void;
}

export function VideoPlayer({ url, events, selectedEventIdx, onEventSelect }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setVideoDuration(null);
    setCurrentTime(0);
  }, [url]);

  const timelineDuration = useMemo(() => {
    if (videoDuration && Number.isFinite(videoDuration) && videoDuration > 0) {
      return videoDuration;
    }

    const maxEventTs = events.reduce((max, event) => Math.max(max, event.timestamp_seconds), 0);
    return maxEventTs > 0 ? maxEventTs : 60;
  }, [videoDuration, events]);

  useEffect(() => {
    if (selectedEventIdx !== null && videoRef.current) {
      const video = videoRef.current;
      const targetTs = events[selectedEventIdx]!.timestamp_seconds;
      const contextStart = Math.max(0, targetTs - EVENT_PREROLL_SECONDS);
      const maxSeek = Number.isFinite(video.duration) && video.duration > 0
        ? Math.max(0, video.duration - 0.05)
        : contextStart;
      video.currentTime = Math.max(0, Math.min(contextStart, maxSeek));
      video.play().catch(() => {});
    }
  }, [selectedEventIdx, events]);

  const progressRatio = Math.max(0, Math.min(1, currentTime / timelineDuration));

  const eventLanes = useMemo(() => {
    const laneCount = 3;
    const minGapPercent = 5;
    const laneLastPos = Array.from({ length: laneCount }, () => -Infinity);

    return events.map((event) => {
      const ratio = Math.max(0, Math.min(1, event.timestamp_seconds / timelineDuration));
      let lane = 0;

      for (let i = 0; i < laneCount; i += 1) {
        if ((ratio * 100) - laneLastPos[i]! >= minGapPercent) {
          lane = i;
          break;
        }
      }

      laneLastPos[lane] = ratio * 100;
      return { lane, ratio };
    });
  }, [events, timelineDuration]);

  const eventWindows = useMemo(() => {
    return events.map(event => {
      const halfWindow = EVENT_WINDOW_SECONDS / 2;
      const start = Math.max(0, event.timestamp_seconds - halfWindow);
      const end = Math.min(timelineDuration, event.timestamp_seconds + halfWindow);
      const startRatio = Math.max(0, Math.min(1, start / timelineDuration));
      const endRatio = Math.max(0, Math.min(1, end / timelineDuration));
      return { startRatio, endRatio };
    });
  }, [events, timelineDuration]);

  function handleTimelineClick(event: MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current || !videoRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const usableWidth = Math.max(1, rect.width - (TIMELINE_PAD_PX * 2));
    const relX = Math.max(0, Math.min(usableWidth, (event.clientX - rect.left) - TIMELINE_PAD_PX));
    const ratio = usableWidth > 0 ? relX / usableWidth : 0;
    const seekTo = ratio * timelineDuration;
    const video = videoRef.current;
    const maxSeek = Number.isFinite(video.duration) && video.duration > 0
      ? Math.max(0, video.duration - 0.05)
      : seekTo;
    video.currentTime = Math.max(0, Math.min(seekTo, maxSeek));
    setCurrentTime(video.currentTime);
  }

  return (
    <div className="video-player">
      <div className="video-stage">
        <video
          ref={videoRef}
          src={url}
          controls
          className="video-element"
          onLoadedMetadata={e => {
            const duration = e.currentTarget.duration;
            setVideoDuration(Number.isFinite(duration) ? duration : null);
          }}
          onDurationChange={e => {
            const duration = e.currentTarget.duration;
            setVideoDuration(Number.isFinite(duration) ? duration : null);
          }}
          onTimeUpdate={e => {
            setCurrentTime(e.currentTarget.currentTime);
          }}
        />
      </div>

      <div
        ref={timelineRef}
        className="event-timeline"
        role="region"
        aria-label="Event timeline"
        onClick={handleTimelineClick}
      >
        <div className="timeline-lane-grid">
          <span />
          <span />
          <span />
        </div>
        <div className="timeline-rail" />
        {events.map((event, idx) => (
          <div
            key={`window-${idx}`}
            className={`event-window ${event.severity.toLowerCase()}`}
            style={{
              left: `calc(var(--timeline-pad) + (100% - (var(--timeline-pad) * 2)) * ${eventWindows[idx]!.startRatio})`,
              width: `calc((100% - (var(--timeline-pad) * 2)) * ${Math.max(0.005, eventWindows[idx]!.endRatio - eventWindows[idx]!.startRatio)})`
            }}
          />
        ))}
        <div className="timeline-progress" style={{ width: `calc((100% - (var(--timeline-pad) * 2)) * ${progressRatio})` }} />
        <div className="timeline-playhead" style={{ left: `calc(var(--timeline-pad) + (100% - (var(--timeline-pad) * 2)) * ${progressRatio})` }} />

        {events.map((event, idx) => (
          <button
            key={idx}
            aria-label={`event marker ${idx + 1}: ${event.severity} at ${event.timestamp_seconds}s`}
            className={`event-marker ${event.severity.toLowerCase()} lane-${eventLanes[idx]!.lane} ${selectedEventIdx === idx ? 'selected' : ''}`}
            style={{
              left: `calc(var(--timeline-pad) + (100% - (var(--timeline-pad) * 2)) * ${eventLanes[idx]!.ratio})`,
              background: SEVERITY_COLOR[event.severity]
            }}
            onClick={e => {
              e.stopPropagation();
              onEventSelect(idx);
            }}
            title={`${event.severity}: ${event.type} at ${event.timestamp_seconds}s`}
          >
            <span className="event-marker-label">
              {event.timestamp_seconds.toFixed(1)}s
            </span>
          </button>
        ))}

        <div className="timeline-timecode">
          <span>{currentTime.toFixed(1)}s</span>
          <span>{timelineDuration.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}
