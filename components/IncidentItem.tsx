
import React, { memo } from 'react';
import { ProcessedIncident, Severity } from '../types';

interface IncidentItemProps {
  incident: ProcessedIncident;
  onFocus: (incident: ProcessedIncident) => void;
  isActive: boolean;
}

const SeverityBadge: React.FC<{ severity: Severity; score: number }> = memo(({ severity, score }) => {
  const styles = {
    [Severity.CRITICAL]: 'bg-red-700 text-white shadow-[0_0_10px_rgba(185,28,28,0.5)]',
    [Severity.MAJOR]: 'bg-amber-500 text-black font-bold',
    [Severity.MINOR]: 'bg-blue-700 text-white'
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-black tracking-widest uppercase ${styles[severity]}`}>
        {severity}
      </span>
      <span className="text-[10px] font-mono text-zinc-400">P-{score}</span>
    </div>
  );
});

export const IncidentItem: React.FC<IncidentItemProps> = memo(({ incident, onFocus, isActive }) => {
  const time = new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isCritical = incident.severity === Severity.CRITICAL;

  return (
    <div 
      role="listitem"
      tabIndex={0}
      aria-label={`${incident.severity} incident: ${incident.summary}`}
      onClick={() => onFocus(incident)}
      onKeyDown={(e) => e.key === 'Enter' && onFocus(incident)}
      className={`
        relative p-4 rounded-xl border-l-4 transition-all cursor-pointer focus-ring group
        ${isActive ? 'bg-zinc-800 border-yellow-400' : 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-500'}
        ${isCritical && incident.status === 'ACTIVE' ? 'animate-pulse-red' : ''}
        ${incident.status === 'SOLVED' ? 'opacity-50 grayscale' : ''}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <SeverityBadge severity={incident.severity} score={incident.priority_score} />
        <span className="text-zinc-500 text-[10px] font-mono font-bold tracking-tighter uppercase">{time}</span>
      </div>
      
      <p className={`text-sm leading-tight font-semibold mb-3 ${isActive ? 'text-white' : 'text-zinc-300'}`}>
        {incident.summary}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
           <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono uppercase tracking-tighter border border-zinc-700">
            {incident.type}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter border
            ${incident.status === 'ACTIVE' ? 'bg-green-900/20 text-green-400 border-green-800' : 
              incident.status === 'DISPATCHED' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800' :
              'bg-zinc-800 text-zinc-500 border-zinc-700'}
          `}>
            {incident.status}
          </span>
        </div>
      </div>
      
      {isActive && (
        <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
});
