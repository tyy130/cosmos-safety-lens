/*
===============================================
  _____ _   ___ _____ ___ ___  ___  _____   __
 |_   _/_\ / __|_   _|_ _/ __|   \| __\ \ / /
   | |/ _ \ (__  | |  | | (__| |) | _| \ V /
   |_/_/ \_\___| |_| |___\___|___/|___| \_/
                                    v2.14.7-hpc
===============================================
*/

import type { AnalysisResult } from '../types';

interface Props {
  result: AnalysisResult;
  selectedEventIdx: number | null;
  onEventSelect: (idx: number) => void;
}

const SEVERITY_LABEL = {
  CRITICAL: { label: 'CRITICAL', className: 'badge-critical' },
  WARNING: { label: 'WARNING', className: 'badge-warning' },
  INFO: { label: 'INFO', className: 'badge-info' }
} as const;

export function ReasoningPanel({ result, selectedEventIdx, onEventSelect }: Props) {
  const selectedEvent = selectedEventIdx !== null ? result.events[selectedEventIdx] : null;

  return (
    <div className="reasoning-panel">
      <div className="summary">
        <h3>Summary</h3>
        <p>{result.summary}</p>
        <span className="duration">{(result.duration_ms / 1000).toFixed(1)}s analysis time</span>
      </div>

      <div className="reasoning-trace">
        <h3>
          {selectedEvent
            ? `Event: ${selectedEvent.type.replace('_', ' ')} @ ${selectedEvent.timestamp_seconds}s`
            : 'Full Reasoning Chain'}
        </h3>

        {selectedEvent ? (
          <div className="event-detail">
            <span className={`badge ${SEVERITY_LABEL[selectedEvent.severity].className}`}>
              {selectedEvent.severity}
            </span>
            <p className="event-reasoning">{selectedEvent.reasoning}</p>
          </div>
        ) : (
          <pre className="think-trace">
            {result.rawThink ||
              result.events.map(e =>
                `[${e.timestamp_seconds}s ${e.severity}] ${e.type.replace(/_/g, ' ')}\n${e.reasoning}`
              ).join('\n\n') ||
              'No events detected.'}
          </pre>
        )}
      </div>

      <div className="event-list">
        <h3>All Events ({result.events.length})</h3>
        {result.events.length === 0 && <p className="no-events">No safety events detected.</p>}
        {result.events.map((event, idx) => (
          <button
            key={idx}
            className={`event-item severity-${event.severity.toLowerCase()} ${selectedEventIdx === idx ? 'selected' : ''}`}
            onClick={() => onEventSelect(idx)}
          >
            <span className="event-time">{event.timestamp_seconds}s</span>
            <span className="event-type">{event.type.replace(/_/g, ' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
