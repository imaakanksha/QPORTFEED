
import React from 'react';
import { SystemHealth } from '../types';

export const SystemHealthMonitor: React.FC<{ health: SystemHealth }> = ({ health }) => {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${health.api_status === 'HEALTHY' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
        <span>CORE_{health.api_status}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-700">|</span>
        <span>CACHE_HIT: {health.cache_hit_rate}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-700">|</span>
        <span>UNIT_TESTS: {health.active_tests_passing}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-zinc-700">|</span>
        <span>SYNC: {health.last_sync}</span>
      </div>
    </div>
  );
};
