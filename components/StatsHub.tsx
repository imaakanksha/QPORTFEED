
import React from 'react';
import { DashboardStats } from '../types';

export const StatsHub: React.FC<{ stats: DashboardStats }> = ({ stats }) => {
  return (
    <div className="flex items-center gap-12 px-8 h-full">
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Active Alerts</span>
        <span className="text-xl font-black text-white">{stats.total}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Critical Level</span>
        <span className="text-xl font-black text-red-500">{stats.critical}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">In Progress</span>
        <span className="text-xl font-black text-yellow-400">{stats.dispatched}</span>
      </div>
      <div className="flex flex-col border-l border-zinc-800 pl-12">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Solved / 24h</span>
        <span className="text-xl font-black text-green-500">{stats.solved}</span>
      </div>
    </div>
  );
};
