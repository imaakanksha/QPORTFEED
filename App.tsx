
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { LiveIncidentSidebar } from './components/LiveIncidentSidebar';
import { StatsHub } from './components/StatsHub';
import { SystemHealthMonitor } from './components/SystemHealthMonitor';
import { ProcessedIncident } from './types';
import { useQPort } from './hooks/useQPort';
import { generateTacticalAnalysis, generateAudioAlert } from './services/geminiService';
import { GoogleCloud } from './services/googleServices';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader } from './components/Loader';
import { HospitalModule } from './components/HospitalModule';

const IncidentMap = lazy(() => import('./components/IncidentMap').then(module => ({ default: module.IncidentMap })));
const ReportIncidentModal = lazy(() => import('./components/ReportIncidentModal').then(module => ({ default: module.ReportIncidentModal })));
const DiagnosticOverlay = lazy(() => import('./components/DiagnosticOverlay').then(module => ({ default: module.DiagnosticOverlay })));

const INITIAL_DATA_HINTS = [
  "Major structure fire at 3rd and Market St. Multiple units in transit.",
  "Public transit vehicle collision near Van Ness. Traffic blocked.",
  "Water main break in Mission District. Street damage reported."
];

const App: React.FC = () => {
  const { 
    incidents, stats, health, isAnalyzing, addIncident, updateStatus, prefs, updatePrefs, isAuthenticated, login 
  } = useQPort();
  
  const [focusedIncident, setFocusedIncident] = useState<ProcessedIncident | undefined>();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isAnalyzingTactics, setIsAnalyzingTactics] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    INITIAL_DATA_HINTS.forEach((hint, i) => {
      setTimeout(() => addIncident(hint), i * 1500);
    });
    GoogleCloud.analytics.logEvent('APP_INIT');
  }, [addIncident]);

  const handleManualReport = async (text: string) => {
    const result = await addIncident(text);
    if (result) setFocusedIncident(result);
  };

  const handleTacticalAnalysis = async () => {
    if (!focusedIncident) return;
    setIsAnalyzingTactics(true);
    try {
      const analysis = await generateTacticalAnalysis(focusedIncident);
      setFocusedIncident(prev => prev ? { ...prev, tactical_analysis: analysis } : undefined);
      GoogleCloud.analytics.logEvent('TACTICAL_ANALYSIS_GENERATED', { incidentId: focusedIncident.id });
    } catch (e) {
      GoogleCloud.analytics.logError(e as Error, 'TACTICAL_ANALYSIS');
    } finally {
      setIsAnalyzingTactics(false);
    }
  };

  const handleAudioAlert = async () => {
    if (!focusedIncident || isPlayingAudio) return;
    setIsPlayingAudio(true);
    try {
      const buffer = await generateAudioAlert(`Priority Alert. ${focusedIncident.summary}. Severity: ${focusedIncident.severity}.`);
      
      if (buffer) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await ctx.decodeAudioData(buffer);
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlayingAudio(false);
        source.start(0);
        GoogleCloud.analytics.logEvent('AUDIO_ALERT_PLAYED');
      } else {
        setIsPlayingAudio(false);
      }
    } catch (e) {
      setIsPlayingAudio(false);
      GoogleCloud.analytics.logError(e as Error, 'AUDIO_ALERT');
    }
  };

  return (
    <ErrorBoundary>
      <div className={`flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 ${prefs.highContrast ? 'contrast-150 saturate-200' : ''}`}>
        <div className="fixed top-0 left-0 right-0 h-0.5 z-[150] bg-zinc-900">
          <div className={`h-full bg-red-600 transition-all duration-1000 ${stats.critical > 0 ? 'w-full animate-pulse opacity-100' : 'w-0 opacity-0'}`} />
        </div>

        <header className="fixed top-0 left-[400px] right-0 h-16 bg-zinc-950/95 backdrop-blur-3xl border-b border-zinc-800/80 flex items-center justify-between px-8 z-[100]">
          <div className="flex items-center gap-8">
            <StatsHub stats={stats} />
            <button onClick={() => setIsDiagnosticOpen(true)} className="hover:opacity-80 transition-opacity">
              <SystemHealthMonitor health={health} />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <button 
                onClick={login}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all focus-ring"
              >
                Connect ID Provider
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">CMD_AUTH_ACTIVE</span>
              </div>
            )}

            <button 
              onClick={() => updatePrefs({ ...prefs, searchGrounding: !prefs.searchGrounding })}
              aria-label="Toggle Google Search Grounding"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest focus-ring ${prefs.searchGrounding ? 'bg-blue-600/10 text-blue-400 border-blue-600/30' : 'bg-zinc-900 text-zinc-600 border-zinc-800'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${prefs.searchGrounding ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`} />
              Google_Search: {prefs.searchGrounding ? 'ON' : 'OFF'}
            </button>

            <button 
              onClick={() => updatePrefs({ ...prefs, highContrast: !prefs.highContrast })}
              aria-label="Toggle High Contrast"
              className={`p-2.5 rounded-xl border transition-all active:scale-95 focus-ring ${prefs.highContrast ? 'bg-yellow-400 text-black border-yellow-500' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 000 14 7 7 0 000-14z"/></svg>
            </button>
          </div>
        </header>

        <LiveIncidentSidebar 
          incidents={incidents}
          onIncidentFocus={setFocusedIncident} 
          activeId={focusedIncident?.id}
          onOpenReport={() => setIsReportModalOpen(true)}
        />

        <main className="flex-1 relative pt-16 flex flex-col bg-zinc-900">
          <Suspense fallback={<Loader text="LOADING_GEOSPATIAL_GRID" />}>
            <IncidentMap focusedIncident={focusedIncident} incidents={incidents.filter(i => i.status !== 'SOLVED')} />
          </Suspense>

          {focusedIncident && (
            <div className="absolute bottom-8 left-8 right-8 lg:left-auto lg:w-[540px] z-[120] animate-in slide-in-from-bottom-8 duration-300">
              <section className="bg-zinc-950/98 backdrop-blur-3xl border border-zinc-700/60 p-8 rounded-[3rem] shadow-2xl ring-2 ring-white/5 max-h-[80vh] overflow-y-auto">
                <header className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase ${focusedIncident.priority_score >= 8 ? 'bg-red-600 text-white animate-pulse' : 'bg-yellow-400 text-black'}`}>
                        PRIORITY_{focusedIncident.priority_score}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-zinc-500">{focusedIncident.id}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{focusedIncident.type}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAudioAlert}
                      disabled={isPlayingAudio}
                      className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-full transition-all disabled:opacity-50"
                      aria-label="Play Audio Alert"
                    >
                       <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
                    </button>
                    <button onClick={() => setFocusedIncident(undefined)} className="p-2 text-zinc-600 hover:text-white hover:bg-zinc-800 rounded-full transition-all">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </header>

                <div className="space-y-6">
                  <p className="text-zinc-200 text-xl font-medium leading-tight selection:bg-yellow-400 selection:text-black">
                    {focusedIncident.summary}
                  </p>

                  {focusedIncident.grounding_sources && focusedIncident.grounding_sources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Grounding_Context:</p>
                      <div className="flex flex-wrap gap-2">
                        {focusedIncident.grounding_sources.map((source, idx) => (
                          <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-zinc-500 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                            {source.title.slice(0, 30)}...
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <HospitalModule incidentCoords={focusedIncident.coords} />

                  <div className="pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Strategic AI Analysis</h4>
                      {!focusedIncident.tactical_analysis && (
                        <button 
                          onClick={handleTacticalAnalysis}
                          disabled={isAnalyzingTactics}
                          className="text-[9px] font-bold bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                        >
                          {isAnalyzingTactics ? 'ANALYZING...' : 'GENERATE PLAN'}
                        </button>
                      )}
                    </div>
                    
                    {focusedIncident.tactical_analysis ? (
                      <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">
                        {focusedIncident.tactical_analysis}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                        Awaiting Tactical Command Request...
                      </div>
                    )}
                  </div>

                  <footer className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={() => updateStatus(focusedIncident.id, 'DISPATCHED')}
                      disabled={focusedIncident.status === 'DISPATCHED'}
                      className={`py-5 font-black rounded-3xl transition-all shadow-xl focus-ring active:scale-95 ${focusedIncident.status === 'DISPATCHED' ? 'bg-zinc-800 text-zinc-500 opacity-50' : 'bg-white text-black hover:bg-yellow-400'}`}
                    >
                      {focusedIncident.status === 'DISPATCHED' ? 'ASSETS_COMMITTED' : 'EXECUTE_RESPONSE'}
                    </button>
                    <button 
                      onClick={() => updateStatus(focusedIncident.id, 'SOLVED')}
                      className="py-5 bg-zinc-900 hover:bg-red-950/50 text-white font-black rounded-3xl border border-zinc-800 transition-all shadow-xl focus-ring active:scale-95"
                    >
                      ARCHIVE_LOG
                    </button>
                  </footer>
                </div>
              </section>
            </div>
          )}
        </main>

        <Suspense fallback={null}>
          {isReportModalOpen && (
            <ReportIncidentModal onClose={() => setIsReportModalOpen(false)} onSubmit={handleManualReport} />
          )}

          {isDiagnosticOpen && (
            <DiagnosticOverlay health={health} onClose={() => setIsDiagnosticOpen(false)} />
          )}
        </Suspense>

        <div aria-live="assertive" className="sr-only">
          {stats.critical > 0 && `SYSTEM ALERT: ${stats.critical} critical life-threat incidents detected.`}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
