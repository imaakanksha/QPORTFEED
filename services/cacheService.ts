
import { ProcessedIncident, UIPreferences } from '../types';

const INCIDENT_CACHE = 'qport_incident_history';
const PREFS_KEY = 'qport_user_prefs';

export const CacheController = {
  generateHash: async (text: string): Promise<string> => {
    const msgUint8 = new TextEncoder().encode(text.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  getCachedIncident: (hash: string): ProcessedIncident | null => {
    const data = localStorage.getItem(`${INCIDENT_CACHE}_${hash}`);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (Date.now() - new Date(parsed.timestamp).getTime() > 86400000) {
      localStorage.removeItem(`${INCIDENT_CACHE}_${hash}`);
      return null;
    }
    return parsed;
  },

  cacheIncident: (hash: string, incident: ProcessedIncident): void => {
    localStorage.setItem(`${INCIDENT_CACHE}_${hash}`, JSON.stringify(incident));
  },

  getPreferences: (): UIPreferences => {
    const defaults: UIPreferences = { 
      highContrast: false, 
      mapZoom: 13, 
      autoDispatch: false,
      theme: 'dark',
      searchGrounding: true
    };
    const saved = localStorage.getItem(PREFS_KEY);
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  },

  savePreferences: (prefs: UIPreferences): void => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }
};
