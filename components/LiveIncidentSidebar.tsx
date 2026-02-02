import React, { useMemo } from 'react';
import { ProcessedIncident } from '../types';
import { IncidentItem } from './IncidentItem';
import { VirtualList } from './VirtualList';

interface SidebarProps {
  incidents: ProcessedIncident[];
  onIncidentFocus: (incident: ProcessedIncident) => void;
  activeId?: string;
  onOpenReport: () => void;
}

export const LiveIncidentSidebar: React.FC<SidebarProps> = ({ incidents, onIncidentFocus, activeId, onOpenReport }) => {
  const filtered = useMemo(() => incidents.filter(i => i.status !== 'SOLVED'), [incidents]);
  
  return (
    <aside 
      className="w-[400px] h-full bg-zinc-950 border-r border-zinc-800/50 flex flex-col z-20 shadow-2xl relative"
      aria-label="Emergency response live feed"
    >
      <header className="p-6 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
              </span>
              QPORT_FEED
            </h2>
            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
              Sector: San Francisco Grid
            </p>
          </div>
          <button 
            onClick={onOpenReport}
            className="group px-4 py-2.5 bg-zinc-900 hover:bg-white text-zinc-400 hover:text-black text-[10px] font-black tracking-widest uppercase rounded-xl border border-zinc-800 transition-all focus-ring active:scale-95"
          >
            + NEW REPORT
          </button>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-900/50 border border-zinc-800 px-3 py-2 rounded-lg flex items-center justify-between">
            <span className="text-[9px] font-black text-zinc-500 uppercase">Operational Status</span>
            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest animate-pulse">Synced</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {filtered.length > 0 ? (
          <VirtualList<ProcessedIncident>
            items={filtered}
            height={window.innerHeight - 200} // Approximate usable height
            itemHeight={130} // Estimated height of IncidentItem
            className="p-4"
            renderItem={(inc) => (
              <div className="mb-4">
                <IncidentItem 
                  incident={inc} 
                  isActive={inc.id === activeId}
                  onFocus={onIncidentFocus} 
                />
              </div>
            )}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full opacity-30 px-12 text-center">
             <div className="w-12 h-12 mb-4 border-2 border-zinc-800 border-t-zinc-500 rounded-full animate-spin" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] leading-relaxed">
              No active threats detected. Monitoring city telemetry.
            </p>
          </div>
        )}
      </div>
      
      <footer className="p-4 bg-zinc-950 border-t border-zinc-800/50 text-center z-10">
        <p className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
          QPORT Dashboard // v2.4.1 // Terminal Secured
        </p>
      </footer>
    </aside>
  );
};