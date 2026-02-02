
import React from 'react';
import { SystemHealth } from '../types';

export const DiagnosticOverlay: React.FC<{ health: SystemHealth; onClose: () => void }> = ({ health, onClose }) => {
  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden">
        <header className="p-8 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/20">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Integration_Diagnostics</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">System Self-Test Suite v3.2</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-all">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </header>

        <div className="p-8 space-y-4">
          {health.diagnostic_log.map(test => (
            <div key={test.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${test.status === 'PASS' ? 'bg-green-500' : test.status === 'PENDING' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{test.name}</span>
              </div>
              <div className="text-right">
                <p className={`text-[10px] font-black uppercase ${test.status === 'PASS' ? 'text-green-500' : 'text-zinc-500'}`}>{test.status}</p>
                <p className="text-[9px] font-mono text-zinc-600 uppercase">{test.duration}ms</p>
              </div>
            </div>
          ))}

          <div className="mt-8 pt-6 border-t border-zinc-900 grid grid-cols-2 gap-4 text-center">
            <div className="p-4 rounded-3xl bg-zinc-900">
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Coverage Score</p>
              <p className="text-2xl font-black text-white">{health.active_tests_passing}%</p>
            </div>
            <div className="p-4 rounded-3xl bg-zinc-900">
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Health Logic</p>
              <p className={`text-2xl font-black ${health.api_status === 'HEALTHY' ? 'text-green-500' : 'text-red-500'}`}>{health.api_status}</p>
            </div>
          </div>
        </div>

        <footer className="p-8">
          <button onClick={onClose} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all active:scale-95">
            Return to Dashboard
          </button>
        </footer>
      </div>
    </div>
  );
};
