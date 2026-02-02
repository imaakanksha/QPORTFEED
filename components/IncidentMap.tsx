
import React, { useEffect, useRef, memo } from 'react';
import { ProcessedIncident, Severity } from '../types';

interface IncidentMapProps {
  incidents: ProcessedIncident[];
  focusedIncident?: ProcessedIncident;
}

export const IncidentMap = memo(({ incidents, focusedIncident }: IncidentMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // Initialize Leaflet Map
    if (mapRef.current && !mapInstance.current && (window as any).L) {
      const L = (window as any).L;
      
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [37.7749, -122.4194],
        zoom: 13
      });

      // Use CartoDB Dark Matter tiles for the cyberpunk aesthetic
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      
      mapInstance.current = map;
    }

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Update Markers
  useEffect(() => {
    if (!mapInstance.current || !(window as any).L) return;
    const L = (window as any).L;

    const currentIds = new Set(incidents.map(i => i.id));
    
    // Remove old markers
    markers.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Add/Update markers
    incidents.forEach(inc => {
      let marker = markers.current.get(inc.id);
      const isFocused = focusedIncident?.id === inc.id;
      const markerColor = inc.severity === Severity.CRITICAL ? '#ef4444' : inc.severity === Severity.MAJOR ? '#f59e0b' : '#3b82f6';
      
      const markerOptions = {
        radius: isFocused ? 12 : 8,
        fillColor: markerColor,
        fillOpacity: 1,
        color: isFocused ? '#ffffff' : '#000000',
        weight: isFocused ? 3 : 2,
        opacity: 1
      };

      if (!marker) {
        marker = L.circleMarker([inc.coords.lat, inc.coords.lng], markerOptions)
          .bindTooltip(inc.summary, { 
            direction: 'top', 
            className: 'bg-zinc-900 text-white border border-zinc-700 px-2 py-1 rounded text-xs font-mono',
            offset: [0, -10],
            opacity: 0.9
          })
          .addTo(mapInstance.current);
        markers.current.set(inc.id, marker);
      } else {
        marker.setLatLng([inc.coords.lat, inc.coords.lng]);
        marker.setStyle(markerOptions);
        if (isFocused) {
          marker.bringToFront();
        }
      }
    });
  }, [incidents, focusedIncident]);

  // Pan to focused incident
  useEffect(() => {
    if (focusedIncident && mapInstance.current) {
      mapInstance.current.setView(
        [focusedIncident.coords.lat, focusedIncident.coords.lng], 
        15, 
        { animate: true, duration: 1 }
      );
    }
  }, [focusedIncident]);

  return (
    <div className="relative flex-1 bg-zinc-900 overflow-hidden">
      <div 
        ref={mapRef} 
        className="w-full h-full z-0"
        role="application"
        aria-label="Urban incident mapping grid"
      />
      
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400] pointer-events-none">
        <div className="bg-zinc-950/90 backdrop-blur-xl p-5 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.6)] animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Active_Critical</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Major_Response</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span className="text-[10px] font-black uppercase text-zinc-300 tracking-widest">Standard_Alert</span>
          </div>
          <div className="pt-2 border-t border-zinc-900 flex items-center gap-2 opacity-50">
            <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest line-through">Traffic_Layer</span>
          </div>
        </div>
      </div>
    </div>
  );
});
IncidentMap.displayName = 'IncidentMap';
