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
      const maxSeek = Number.isFinite(video.duration) && video.duration > 0
        ? Math.max(0, video.duration - 0.05)
        : targetTs;
      video.currentTime = Math.max(0, Math.min(targetTs, maxSeek));
      video.play().catch(() => {});
    }
  }, [selectedEventIdx, events]);

  const progressPercent = Math.max(0, Math.min(100, (currentTime / timelineDuration) * 100));

  const eventLanes = useMemo(() => {
    const laneCount = 3;
    const minGapPercent = 5;
    const laneLastPos = Array.from({ length: laneCount }, () => -Infinity);

    return events.map((event) => {
      const pos = Math.max(0, Math.min(100, (event.timestamp_seconds / timelineDuration) * 100));
      let lane = 0;

      for (let i = 0; i < laneCount; i += 1) {
        if (pos - laneLastPos[i]! >= minGapPercent) {
          lane = i;
          break;
        }
      }

      laneLastPos[lane] = pos;
      return { lane, pos };
    });
  }, [events, timelineDuration]);

  function handleTimelineClick(event: MouseEvent<HTMLDivElement>) {
    if (!timelineRef.current || !videoRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const percent = rect.width > 0 ? relX / rect.width : 0;
    const seekTo = percent * timelineDuration;
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
        <div className="timeline-progress" style={{ width: `${progressPercent}%` }} />
        <div className="timeline-playhead" style={{ left: `${progressPercent}%` }} />

        {events.map((event, idx) => (
          <button
            key={idx}
            aria-label={`event marker ${idx + 1}: ${event.severity} at ${event.timestamp_seconds}s`}
            className={`event-marker ${event.severity.toLowerCase()} lane-${eventLanes[idx]!.lane} ${selectedEventIdx === idx ? 'selected' : ''}`}
            style={{
              left: `${eventLanes[idx]!.pos}%`,
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
