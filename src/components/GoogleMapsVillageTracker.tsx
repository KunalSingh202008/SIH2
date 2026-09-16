import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import {
  MapPin,
  Bike,
  Zap,
  Store,
  Navigation,
  Layers,
  Eye,
  Maximize2,
  Compass,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { DeliveryPartner, VillageDarkStore } from '../types';

interface GoogleMapsVillageTrackerProps {
  riderProgress: number; // 0 to 100
  selectedPartner: DeliveryPartner;
  activeDarkStore: VillageDarkStore;
  darkStores: VillageDarkStore[];
  destinationAddress: {
    fullName: string;
    villageOrStreet: string;
    district: string;
    pincode: string;
  };
  onSelectDarkStore?: (store: VillageDarkStore) => void;
}

// Key rural coordinates in Jaipur Rural district (Chomu & Govindgarh corridor)
export const RURAL_ROUTE_COORDINATES = [
  { lat: 27.2418, lng: 75.7238, title: 'Zepto/Blinkit Govindgarh Rural Micro-Hub #04', type: 'origin' },
  { lat: 27.2435, lng: 75.7252, title: 'Govindgarh Sub-Centre PHC & Delivery Corridor', type: 'waypoint' },
  { lat: 27.2452, lng: 75.7276, title: 'Chomu-Govindgarh Link Road Junction', type: 'waypoint' },
  { lat: 27.2468, lng: 75.7295, title: 'Gram Panchayat Circle & Anganwadi Point', type: 'waypoint' },
  { lat: 27.2479, lng: 75.7305, title: 'Ward 3 Canal Bridge Passage', type: 'waypoint' },
  { lat: 27.2488, lng: 75.7314, title: 'Sunita Sharma Doorstep (Ward 4, Govindgarh)', type: 'destination' },
];

export const GoogleMapsVillageTracker: React.FC<GoogleMapsVillageTrackerProps> = ({
  riderProgress,
  selectedPartner,
  activeDarkStore,
  darkStores,
  destinationAddress,
  onSelectDarkStore,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const riderMarkerRef = useRef<any>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const allMarkersRef = useRef<any[]>([]);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mapViewType, setMapViewType] = useState<'roadmap' | 'satellite' | 'terrain' | 'hybrid'>('roadmap');
  const [cameraMode, setCameraMode] = useState<'fit' | 'rider' | 'hub'>('fit');

  // Compute interpolated rider coordinate along the rural route
  const getInterpolatedRiderCoord = (progress: number) => {
    const totalSegments = RURAL_ROUTE_COORDINATES.length - 1;
    const currentProgressFrac = Math.min(Math.max(progress / 100, 0), 0.999);
    const segmentIndex = Math.floor(currentProgressFrac * totalSegments);
    const segmentFrac = (currentProgressFrac * totalSegments) - segmentIndex;

    const p1 = RURAL_ROUTE_COORDINATES[segmentIndex];
    const p2 = RURAL_ROUTE_COORDINATES[segmentIndex + 1];

    return {
      lat: p1.lat + (p2.lat - p1.lat) * segmentFrac,
      lng: p1.lng + (p2.lng - p1.lng) * segmentFrac,
    };
  };

  const riderCoord = getInterpolatedRiderCoord(riderProgress);

  // Initialize Google Maps JavaScript API via functional importLibrary
  useEffect(() => {
    let isMounted = true;
    const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

    // Check if API key is provided
    if (!apiKey) {
      setLoadError('MAPS_API_KEY_UNSET');
      return;
    }

    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
        libraries: ['maps', 'marker'],
      });
    } catch {
      // Options already set
    }

    Promise.all([importLibrary('maps'), importLibrary('marker')])
      .then(([mapsLib, markerLib]) => {
        if (!isMounted || !mapContainerRef.current) return;

        const { Map } = mapsLib;
        const { AdvancedMarkerElement } = markerLib;

        // Initialize Map with mandatory solution attribution ID and mapId
        const map = new Map(mapContainerRef.current, {
          center: { lat: 27.2450, lng: 75.7275 },
          zoom: 14.5,
          mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          mapTypeControl: false, // We provide custom styled pills
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });

        mapInstanceRef.current = map;

        // Create Delivery Route Polyline on Google Maps
        const pathCoords = RURAL_ROUTE_COORDINATES.map((c) => ({ lat: c.lat, lng: c.lng }));
        const polyline = new google.maps.Polyline({
          path: pathCoords,
          geodesic: true,
          strokeColor: '#f43f5e',
          strokeOpacity: 0.9,
          strokeWeight: 5,
          map,
        });
        polylineRef.current = polyline;

        // Add Origin Marker (Micro-Hub)
        const originEl = document.createElement('div');
        originEl.className = 'custom-map-marker origin-marker';
        originEl.innerHTML = `
          <div style="background: #e11d48; color: white; padding: 6px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; box-shadow: 0 4px 12px rgba(225,29,72,0.4); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
            <span>🏪</span>
            <span>Govindgarh Hub</span>
          </div>
        `;
        const originMarker = new AdvancedMarkerElement({
          map,
          position: { lat: RURAL_ROUTE_COORDINATES[0].lat, lng: RURAL_ROUTE_COORDINATES[0].lng },
          title: 'Village Dark Store Micro-Hub',
          content: originEl,
        });
        allMarkersRef.current.push(originMarker);

        // Add Destination Marker (Customer Doorstep)
        const destEl = document.createElement('div');
        destEl.className = 'custom-map-marker dest-marker';
        destEl.innerHTML = `
          <div style="background: #059669; color: white; padding: 6px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; box-shadow: 0 4px 12px rgba(5,150,105,0.4); border: 2px solid white; display: flex; align-items: center; gap: 4px;">
            <span>🏠</span>
            <span>${destinationAddress.fullName.split(' ')[0]}'s Doorstep</span>
          </div>
        `;
        const destMarker = new AdvancedMarkerElement({
          map,
          position: {
            lat: RURAL_ROUTE_COORDINATES[RURAL_ROUTE_COORDINATES.length - 1].lat,
            lng: RURAL_ROUTE_COORDINATES[RURAL_ROUTE_COORDINATES.length - 1].lng,
          },
          title: 'Destination Doorstep',
          content: destEl,
        });
        allMarkersRef.current.push(destMarker);

        // Add Waypoint Markers
        RURAL_ROUTE_COORDINATES.slice(1, -1).forEach((wp) => {
          const wpEl = document.createElement('div');
          wpEl.style.cssText = 'width: 12px; height: 12px; background: #fb7185; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3);';
          const wpMarker = new AdvancedMarkerElement({
            map,
            position: { lat: wp.lat, lng: wp.lng },
            title: wp.title,
            content: wpEl,
          });
          allMarkersRef.current.push(wpMarker);
        });

        // Add Live Moving Rider Marker
        const riderEl = document.createElement('div');
        riderEl.className = 'custom-map-marker rider-marker';
        const isDrone = selectedPartner.partnerType === 'SOS_DRONE';
        riderEl.innerHTML = `
          <div style="background: #1e112a; color: #f43f5e; padding: 6px 10px; border-radius: 14px; font-size: 11px; font-weight: 800; box-shadow: 0 4px 14px rgba(244,63,94,0.5); border: 2px solid #f43f5e; display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 14px;">${isDrone ? '🚁' : '🏍️'}</span>
            <span style="color: #ffffff;">${selectedPartner.riderName.split(' ')[0]}</span>
            <span style="font-size: 9px; background: rgba(244,63,94,0.25); padding: 1px 4px; border-radius: 4px; color: #fbcfe8;">Live</span>
          </div>
        `;
        const riderMarker = new AdvancedMarkerElement({
          map,
          position: riderCoord,
          title: `Delivery Partner: ${selectedPartner.riderName}`,
          content: riderEl,
        });
        riderMarkerRef.current = riderMarker;

        // Add other Village Dark Stores in the district
        darkStores.forEach((store) => {
          if (store.latitude && store.longitude && store.id !== activeDarkStore.id) {
            const storeEl = document.createElement('div');
            storeEl.style.cssText =
              'background: #311b42; color: #fbcfe8; padding: 4px 8px; border-radius: 10px; font-size: 10px; font-weight: 600; border: 1px solid rgba(244,63,94,0.4); cursor: pointer; display: flex; align-items: center; gap: 3px;';
            storeEl.innerHTML = `<span>📦</span><span>${store.block} Hub</span>`;
            storeEl.onclick = () => {
              if (onSelectDarkStore) onSelectDarkStore(store);
            };
            const storeMarker = new AdvancedMarkerElement({
              map,
              position: { lat: store.latitude, lng: store.longitude },
              title: store.name,
              content: storeEl,
            });
            allMarkersRef.current.push(storeMarker);
          }
        });

        setMapLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        console.warn('Google Maps loader notice:', err);
        setLoadError('LOAD_FAILED');
      });

    return () => {
      isMounted = false;
      if (allMarkersRef.current) {
        allMarkersRef.current.forEach((m) => (m.map = null));
        allMarkersRef.current = [];
      }
      if (riderMarkerRef.current) {
        riderMarkerRef.current.map = null;
        riderMarkerRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  // Update Rider Marker position smoothly as riderProgress advances
  useEffect(() => {
    if (riderMarkerRef.current && mapLoaded) {
      const newPos = getInterpolatedRiderCoord(riderProgress);
      riderMarkerRef.current.position = newPos;

      // If camera mode is set to 'rider', pan map to follow rider
      if (cameraMode === 'rider' && mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newPos);
      }
    }
  }, [riderProgress, mapLoaded, cameraMode]);

  // Handle map type changes (Roadmap, Satellite, Terrain, Hybrid)
  const handleMapTypeChange = (type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid') => {
    setMapViewType(type);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(type);
    }
  };

  // Recenter map to fit route
  const handleFitRoute = () => {
    setCameraMode('fit');
    if (mapInstanceRef.current) {
      const bounds = new google.maps.LatLngBounds();
      RURAL_ROUTE_COORDINATES.forEach((c) => bounds.extend({ lat: c.lat, lng: c.lng }));
      mapInstanceRef.current.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  };

  // Pan to Active Village Dark Store
  const handleFocusDarkStore = () => {
    setCameraMode('hub');
    if (mapInstanceRef.current && activeDarkStore.latitude && activeDarkStore.longitude) {
      mapInstanceRef.current.panTo({
        lat: activeDarkStore.latitude,
        lng: activeDarkStore.longitude,
      });
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-[#09050d] border border-rose-500/30 overflow-hidden shadow-inner flex flex-col">
      {/* Top Map Control Bar */}
      <div className="p-3 bg-gradient-to-r from-[#1b0d28] via-[#140a1e] to-[#0d0615] border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-2.5 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-rose-400" />
            <span>Google Maps Village Corridor</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Jaipur Rural (Rajasthan)
          </span>
        </div>

        {/* View Mode & Camera Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <div className="bg-[#241335] rounded-xl p-0.5 border border-rose-500/30 flex items-center">
            <button
              type="button"
              onClick={() => handleMapTypeChange('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                mapViewType === 'roadmap'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-200 hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              type="button"
              onClick={() => handleMapTypeChange('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                mapViewType === 'satellite'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-200 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              type="button"
              onClick={() => handleMapTypeChange('terrain')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                mapViewType === 'terrain'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-rose-200 hover:text-white'
              }`}
            >
              Terrain
            </button>
          </div>

          <button
            type="button"
            onClick={handleFitRoute}
            className="px-2.5 py-1 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-200 border border-rose-500/30 text-[11px] font-bold transition flex items-center gap-1"
            title="Fit route in viewport"
          >
            <Maximize2 className="w-3 h-3 text-pink-400" />
            <span>Fit Route</span>
          </button>

          <button
            type="button"
            onClick={() => setCameraMode(cameraMode === 'rider' ? 'fit' : 'rider')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
              cameraMode === 'rider'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-rose-950/60 text-rose-200 hover:bg-rose-900/60 border border-rose-500/30'
            }`}
            title="Keep camera centered on moving delivery rider"
          >
            <Bike className="w-3 h-3 text-white" />
            <span>Follow Rider</span>
          </button>
        </div>
      </div>

      {/* Map Surface / Canvas */}
      <div className="relative w-full h-[360px] sm:h-[400px]">
        {/* Google Maps Container */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${loadError ? 'hidden' : 'block'}`}
        />

        {/* Fallback & Interactive Rural Coordinates Display if API key is not yet set */}
        {loadError && (
          <div className="relative w-full h-full bg-[#0a0510] overflow-hidden flex flex-col items-center justify-center p-4">
            {/* SVG Rural Road Map Simulation */}
            <svg
              className="absolute inset-0 w-full h-full object-cover opacity-85"
              viewBox="0 0 450 280"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="gmpRouteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="50%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <pattern id="gmpRuralGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(244, 63, 94, 0.08)" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="450" height="280" fill="url(#gmpRuralGrid)" />

              {/* Village Fields */}
              <path d="M 10 10 Q 70 40 50 110 Q 20 160 10 240 Z" fill="rgba(16, 185, 129, 0.05)" />
              <path d="M 280 20 Q 380 40 430 110 Q 440 220 330 260 Z" fill="rgba(244, 63, 94, 0.05)" />

              {/* Secondary Village Lanes */}
              <path d="M 20 80 Q 140 100 220 40 T 430 30" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="3" fill="none" strokeDasharray="4 4" />
              <path d="M 50 260 Q 150 190 280 240 T 430 220" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="3" fill="none" />

              {/* Active Delivery Corridor */}
              <path d="M 60 220 C 100 200, 140 210, 180 230 S 260 180, 310 120 T 380 80" stroke="url(#gmpRouteGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />

              {/* Animated pulses along path */}
              <path d="M 60 220 C 100 200, 140 210, 180 230 S 260 180, 310 120 T 380 80" stroke="#ffffff" strokeWidth="2" strokeDasharray="6 8" fill="none" opacity="0.8">
                <animate attributeName="stroke-dashoffset" from="100" to="0" dur="3.5s" repeatCount="indefinite" />
              </path>

              {/* Origin Hub */}
              <g transform="translate(60, 220)">
                <circle r="12" fill="rgba(244, 63, 94, 0.3)" className="animate-ping" />
                <circle r="8" fill="#e11d48" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="22" textAnchor="middle" fill="#fbcfe8" fontSize="9" fontWeight="bold">
                  🏪 Govindgarh Hub
                </text>
              </g>

              {/* PHC Sub-Centre */}
              <g transform="translate(180, 230)">
                <circle r="6" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                <text x="0" y="16" textAnchor="middle" fill="#c4b5fd" fontSize="8">
                  🏥 Sub-Centre PHC
                </text>
              </g>

              {/* Destination Doorstep */}
              <g transform="translate(380, 80)">
                <circle r="14" fill="rgba(16, 185, 129, 0.3)" className="animate-ping" />
                <circle r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                <text x="0" y="-14" textAnchor="middle" fill="#a7f3d0" fontSize="9" fontWeight="bold">
                  🏠 {destinationAddress.fullName.split(' ')[0]}'s Doorstep
                </text>
              </g>

              {/* Moving Rider Pin */}
              {(() => {
                const rx = 60 + (380 - 60) * (riderProgress / 100);
                const ry = 220 + (80 - 220) * (riderProgress / 100);
                return (
                  <g transform={`translate(${rx}, ${ry})`}>
                    <circle r="16" fill="rgba(244, 63, 94, 0.4)" className="animate-pulse" />
                    <circle r="10" fill="#fb7185" stroke="#ffffff" strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10">
                      {selectedPartner.partnerType === 'SOS_DRONE' ? '🚁' : '🏍️'}
                    </text>
                    <rect x="-45" y="-28" width="90" height="18" rx="5" fill="rgba(20, 10, 30, 0.95)" stroke="#f43f5e" strokeWidth="1" />
                    <text x="0" y="-16" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                      {selectedPartner.riderName.split(' ')[0]} ({Math.round(selectedPartner.distanceKm * (1 - riderProgress / 100) * 10) / 10} km)
                    </text>
                  </g>
                );
              })()}
            </svg>

            {/* Informational overlay badge */}
            <div className="absolute top-4 left-4 right-4 sm:right-auto z-10 max-w-md bg-[#190c26]/90 backdrop-blur-md p-3 rounded-2xl border border-rose-500/30 text-xs shadow-xl">
              <div className="flex items-center gap-2 text-rose-300 font-bold mb-1">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Google Maps Platform Integration Active</span>
              </div>
              <p className="text-[11px] text-rose-100/80 leading-snug">
                Simulating real-time telemetry along Govindgarh rural corridor (27.2418° N, 75.7238° E). Connect your <span className="font-mono text-pink-300">VITE_GOOGLE_MAPS_API_KEY</span> in settings for live Google satellite tiles & Photorealistic 3D street renders.
              </p>
            </div>
          </div>
        )}

        {/* Floating Live Telemetry Badge */}
        <div className="absolute bottom-3 left-3 bg-[#160a22]/90 backdrop-blur-md border border-rose-500/30 rounded-2xl p-2.5 sm:p-3 text-xs shadow-xl z-20 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold shrink-0">
            {selectedPartner.partnerType === 'SOS_DRONE' ? <Zap className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-mono text-rose-300 tracking-wider block">
              Live GPS Coordinates:
            </span>
            <div className="text-white font-bold font-mono text-[11px]">
              {riderCoord.lat.toFixed(4)}° N, {riderCoord.lng.toFixed(4)}° E
            </div>
            <div className="text-[10px] text-emerald-400 font-medium">
              Speed: 28 km/h • Network: Gramin 4G/GPS Lock
            </div>
          </div>
        </div>
      </div>

      {/* Mandatory Google Maps Platform Attribution (dedicated separate line) */}
      <div className="py-1 px-4 bg-[#0a0510] border-t border-rose-500/10 flex justify-between items-center text-[10px] text-rose-300/60 font-sans">
        <span>Rural Village Corridor GIS Engine • StreeSure Express</span>
        <span>Google Maps</span>
      </div>
    </div>
  );
};
