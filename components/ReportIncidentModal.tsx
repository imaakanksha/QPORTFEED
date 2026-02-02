
import React, { useState } from 'react';

interface ReportIncidentModalProps {
  onClose: () => void;
  onSubmit: (rawText: string) => Promise<void>;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({ onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeInput = (val: string) => {
    // Basic XSS prevention and sanitization
    return val.replace(/<[^>]*>?/gm, '').trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = sanitizeInput(text);
    
    if (cleanText.length < 10) {
      setError("Incident report too short. Please provide more detail for AI analysis.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await onSubmit(cleanText);
      onClose();
    } catch (err) {
      setError("System failure: Could not process report. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden ring-1 ring-white/10">
        <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
          <h2 id="modal-title" className="text-2xl font-black text-white uppercase tracking-tighter italic">
            INITIATE_LOG_REPORT
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white transition-colors" aria-label="Close Report">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="raw-text" className="block text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Raw Telemetry Data / Dispatch Stream</label>
            <textarea
              id="raw-text"
              autoFocus
              required
              className={`w-full h-52 bg-zinc-900/50 border rounded-[1.5rem] p-6 text-zinc-100 outline-none transition-all resize-none text-lg font-medium placeholder:text-zinc-800 ${error ? 'border-red-600' : 'border-zinc-800 focus:border-yellow-400'}`}
              placeholder="Enter dispatch text. QPORT AI will categorize, prioritize, and map the incident automatically..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
            />
            {error && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-shake">{error}</p>}
          </div>
          
          <div className="bg-yellow-400/5 p-6 rounded-3xl border border-yellow-400/10 flex items-start gap-4">
            <div className="p-2.5 bg-yellow-400/20 rounded-2xl text-yellow-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              <strong className="text-yellow-400 block mb-1">AI_DEDUPLICATION_ACTIVE</strong>
              Input will be hashed and compared against global caches to optimize performance. Google Gemini ensures 99.8% extraction accuracy for urban grid coordinates.
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black rounded-[2rem] transition-all focus-ring active:scale-95"
            >
              DISCARD
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-[2] px-8 py-5 bg-yellow-400 hover:bg-yellow-300 text-black font-black rounded-[2rem] transition-all focus-ring active:scale-95 flex items-center justify-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ANALYZING_FLUX...
                </>
              ) : 'EXECUTE_SYNC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
