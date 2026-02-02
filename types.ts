
export enum Severity {
  CRITICAL = 'CRITICAL',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR'
}

export type IncidentStatus = 'ACTIVE' | 'DISPATCHED' | 'SOLVED' | 'ERROR';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface Hospital {
  id: string;
  name: string;
  coords: Coordinates;
  status: 'FULL' | 'AVAILABLE' | 'CRITICAL';
  beds: number;
  distance?: number;
}

export interface ProcessedIncident {
  id: string;
  summary: string;
  type: string;
  severity: Severity;
  priority_score: number;
  coords: Coordinates;
  timestamp: string;
  status: IncidentStatus;
  raw_source?: string;
  processing_latency?: number;
  grounding_sources?: GroundingSource[];
  tactical_analysis?: string;
}

export interface DashboardStats {
  total: number;
  critical: number;
  dispatched: number;
  solved: number;
}

export interface UIPreferences {
  highContrast: boolean;
  mapZoom: number;
  autoDispatch: boolean;
  theme: 'dark' | 'light';
  searchGrounding: boolean;
}

export interface TestResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  duration: number;
}

export interface SystemHealth {
  api_status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  cache_hit_rate: number;
  active_tests_passing: number;
  last_sync: string;
  diagnostic_log: TestResult[];
}