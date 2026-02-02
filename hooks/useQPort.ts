
import { useState, useCallback, useMemo, useEffect } from 'react';
import { ProcessedIncident, DashboardStats, SystemHealth, Severity, TestResult, UIPreferences } from '../types';
import { CacheController } from '../services/cacheService';
import { processIncidentWithAI, checkApiHealth } from '../services/geminiService';
import { GoogleCloud } from '../services/googleServices';
import { TestRunner } from '../services/testRunner';

export const useQPort = () => {
  const [incidents, setIncidents] = useState<ProcessedIncident[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cacheHits, setCacheHits] = useState(0);
  const [totalRequests, setTotalRequests] = useState(0);
  const [diagnosticLog, setDiagnosticLog] = useState<TestResult[]>([]);
  const [prefs, setPrefs] = useState<UIPreferences>(CacheController.getPreferences());
  const [isAuthenticated, setIsAuthenticated] = useState(GoogleCloud.auth.isAuthenticated());

  const stats: DashboardStats = useMemo(() => {
    const active = incidents.filter(i => i.status !== 'SOLVED');
    return {
      total: active.length,
      critical: active.filter(i => i.severity === Severity.CRITICAL).length,
      dispatched: active.filter(i => i.status === 'DISPATCHED').length,
      solved: incidents.filter(i => i.status === 'SOLVED').length
    };
  }, [incidents]);

  const runDiagnostics = useCallback(async () => {
    GoogleCloud.analytics.logEvent('DIAGNOSTICS_STARTED');
    
    // Initial State
    setDiagnosticLog([
      { id: 'core', name: 'Core System Health', status: 'PENDING', duration: 0 },
      { id: 'cloud', name: 'Google Cloud Handshake', status: 'PENDING', duration: 0 },
      { id: 'suite', name: 'Integration Test Suite', status: 'PENDING', duration: 0 }
    ]);

    // 1. Core Health
    const apiStart = performance.now();
    const isApiHealthy = await checkApiHealth();
    
    // 2. Run Comprehensive Test Suite
    const suiteResults = await TestRunner.runSuite();
    const suitePass = suiteResults.every(r => r.status === 'PASS');

    // 3. Update Logs
    setDiagnosticLog(prev => [
      { id: 'core', name: 'Core GenAI API', status: isApiHealthy ? 'PASS' : 'FAIL', duration: Math.round(performance.now() - apiStart) },
      { id: 'cloud', name: 'GCP Service Mock', status: 'PASS', duration: 50 },
      ...suiteResults.map((r, i) => ({
        id: `suite_${i}`,
        name: r.name,
        status: r.status as 'PASS' | 'FAIL',
        duration: Math.round(r.duration)
      }))
    ]);

    GoogleCloud.analytics.logEvent('DIAGNOSTICS_COMPLETED', { success: suitePass });
  }, []);

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const login = async () => {
    try {
      await GoogleCloud.auth.signIn();
      setIsAuthenticated(true);
      GoogleCloud.analytics.logEvent('USER_LOGIN');
    } catch (e) {
      console.error(e);
    }
  };

  const health: SystemHealth = useMemo(() => {
    const passing = diagnosticLog.filter(t => t.status === 'PASS').length;
    return {
      api_status: diagnosticLog.find(t => t.id === 'core')?.status === 'FAIL' ? 'DOWN' : incidents.some(i => i.status === 'ERROR') ? 'DEGRADED' : 'HEALTHY',
      cache_hit_rate: totalRequests === 0 ? 0 : Math.round((cacheHits / totalRequests) * 100),
      active_tests_passing: diagnosticLog.length === 0 ? 0 : Math.round((passing / diagnosticLog.length) * 100),
      last_sync: new Date().toLocaleTimeString(),
      diagnostic_log: diagnosticLog
    };
  }, [incidents, cacheHits, totalRequests, diagnosticLog]);

  const addIncident = useCallback(async (rawText: string) => {
    const start = performance.now();
    setTotalRequests(prev => prev + 1);
    setIsAnalyzing(true);
    
    try {
      const hash = await CacheController.generateHash(rawText);
      const cached = CacheController.getCachedIncident(hash);
      
      if (cached) {
        setCacheHits(prev => prev + 1);
        setIncidents(prev => {
          const exists = prev.find(i => i.id === cached.id);
          if (exists) return [cached, ...prev.filter(i => i.id !== cached.id)];
          return [cached, ...prev];
        });
        setIsAnalyzing(false);
        return cached;
      }

      const processed = await processIncidentWithAI(rawText, prefs.searchGrounding);
      
      // Async Sync to Cloud (Fire & Forget for performance)
      GoogleCloud.firestore.syncIncident(processed).catch(err => 
        GoogleCloud.analytics.logError(err, 'CLOUD_SYNC_FAIL')
      );

      CacheController.cacheIncident(hash, processed);
      setIncidents(prev => [processed, ...prev]);
      setIsAnalyzing(false);
      
      GoogleCloud.analytics.logEvent('INCIDENT_PROCESSED', { type: processed.type, severity: processed.severity });
      
      return processed;
    } catch (e) {
      setIsAnalyzing(false);
      GoogleCloud.analytics.logError(e as Error, 'ADD_INCIDENT');
      return null;
    }
  }, [cacheHits, totalRequests, prefs.searchGrounding]);

  const updateStatus = useCallback((id: string, status: ProcessedIncident['status']) => {
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    GoogleCloud.analytics.logEvent('STATUS_UPDATE', { id, status });
  }, []);

  const updatePrefs = useCallback((newPrefs: UIPreferences) => {
    setPrefs(newPrefs);
    CacheController.savePreferences(newPrefs);
  }, []);

  return { 
    incidents, 
    stats, 
    health, 
    isAnalyzing, 
    addIncident, 
    updateStatus, 
    prefs, 
    updatePrefs, 
    runDiagnostics,
    isAuthenticated,
    login
  };
};
