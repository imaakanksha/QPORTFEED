
import React, { useMemo } from 'react';
import { Hospital, Coordinates } from '../types';

const MOCK_HOSPITALS: Hospital[] = [
  { id: 'H1', name: 'Zuckerberg SF General', coords: { lat: 37.7557, lng: -122.4046 }, status: 'AVAILABLE', beds: 42 },
  { id: 'H2', name: 'UCSF Medical Center', coords: { lat: 37.7631, lng: -122.4582 }, status: 'FULL', beds: 0 },
  { id: 'H3', name: 'Saint Francis Memorial', coords: { lat: 37.7894, lng: -122.4153 }, status: 'CRITICAL', beds: 3 },
  { id: 'H4', name: 'CPMC Van Ness', coords: { lat: 37.7853, lng: -122.4227 }, status: 'AVAILABLE', beds: 18 }
];

interface Props {
  incidentCoords: Coordinates;
}

// Haversine formula to calculate distance in miles
const calculateDistance = (c1: Coordinates, c2: Coordinates): number => {
  const R = 3958.8; // Earth radius in miles
  const toRad = (val: number) => val * (Math.PI / 180);
  
  const dLat = toRad(c2.lat - c1.lat);
  const dLon = toRad(c2.lng - c1.lng);
  const lat1 = toRad(c1.lat);
  const lat2 = toRad(c2.lat);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};

export const HospitalModule: React.FC<Props> = ({ incidentCoords }) => {
  const hospitals = useMemo(() => {
    return MOCK_HOSPITALS.map(h => {
      const distance = calculateDistance(incidentCoords, h.coords);
      return { ...h, distance };
    }).sort((a, b) => a.distance - b.distance);
  }, [incidentCoords]);

  return (
    <div className="mt-6 border-t border-zinc-800/50 pt-6">
      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Tactical Asset: Medical Availability</h4>
      <div className="space-y-2.5">
        {hospitals.slice(0, 3).map(h => (
          <div key={h.id} className="flex items-center justify-between bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50 group hover:border-zinc-600 transition-colors">
            <div className="flex flex-col">
              <p className="text-[11px] font-black text-white uppercase tracking-tight leading-none mb-1 group-hover:text-yellow-400 transition-colors">
                {h.name}
              </p>
              <div className="flex items-center gap-2">
                 <span className="text-[9px] font-mono text-zinc-500 uppercase">Dist: {h.distance?.toFixed(1)}mi</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest border
                ${h.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                  h.status === 'CRITICAL' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                  'bg-red-500/10 text-red-500 border-red-500/20'}
              `}>
                {h.status === 'AVAILABLE' ? `${h.beds} BEDS` : h.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
