
import React from 'react';

export const Loader: React.FC<{ text?: string }> = ({ text = "INITIALIZING_MODULE" }) => (
  <div className="flex flex-col items-center justify-center h-full w-full min-h-[200px] text-yellow-500/50 space-y-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-t-2 border-yellow-500 rounded-full animate-spin"></div>
      <div className="absolute inset-2 border-b-2 border-yellow-500/50 rounded-full animate-spin duration-1000 direction-reverse"></div>
    </div>
    <span className="text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">{text}</span>
  </div>
);
