import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Layers, MapPin, ZoomIn, ZoomOut, Compass } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

export interface MapMarkerItem {
  id: string;
  category: 'NGO' | 'PROJECT' | 'INSPECTION' | 'HIGH_RISK' | 'LIVE_MONITORING';
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  statusText: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, unknown>;
}

interface DrishtiMapProps {
  markers: MapMarkerItem[];
  onSelectMarker?: (marker: MapMarkerItem) => void;
  selectedMarkerId?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  title?: string;
  showFilters?: boolean;
}

export const DrishtiMap: React.FC<DrishtiMapProps> = ({
  markers,
  onSelectMarker,
  selectedMarkerId,
  center = { lat: 23.2599, lng: 77.4126 }, // Center MP / Central India
  zoom = 6,
  className = 'w-full h-[460px]',
  title = 'Project & Organization Locations',
  showFilters = true
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const googleMapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Map view mode: 'google' | 'vector'
  const [mapMode, setMapMode] = useState<'google' | 'vector'>('google');

  // Filter state
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<
    'ALL' | 'NGO' | 'PROJECT' | 'INSPECTION' | 'HIGH_RISK' | 'LIVE_MONITORING'
  >('ALL');

  // Selected Marker for Clean White Detail Panel
  const [activeMarkerDetail, setActiveMarkerDetail] = useState<MapMarkerItem | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD33fZ78Gqsm5pMj2kRreaB3VRBW9DDCqg';

  useEffect(() => {
    let isMounted = true;

    const loadGoogleMapsScript = async () => {
      if (window.google?.maps) {
        if (isMounted) setMapLoaded(true);
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (isMounted) setMapLoaded(true);
        });
        return;
      }

      try {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) setMapLoaded(true);
        };
        script.onerror = () => {
          if (isMounted) {
            setLoadError('Unable to load Google Maps satellite layer. Using interactive Vector Dot Map.');
            setMapMode('vector');
          }
        };
        document.head.appendChild(script);
      } catch {
        if (isMounted) {
          setLoadError('Error initializing maps script. Using Vector Dot Map.');
          setMapMode('vector');
        }
      }
    };

    loadGoogleMapsScript();

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Initialize Map with clean, light government styling
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !window.google?.maps || mapMode !== 'google') return;

    if (!googleMapInstance.current) {
      // Clean, light, high-clarity map styling
      const lightGovernmentMapStyles: any[] = [
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#dbeafe' }, { visibility: 'on' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f8fafc' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#e2e8f0' }]
        },
        {
          featureType: 'road',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#64748b' }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#f1f5f9' }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#cbd5e1' }, { weight: 1 }]
        },
        {
          featureType: 'administrative.country',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#94a3b8' }, { weight: 1.5 }]
        }
      ];

      googleMapInstance.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: lightGovernmentMapStyles,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true
      });
    }
  }, [mapLoaded, center, zoom, mapMode]);

  // Filter markers based on active tab
  const filteredMarkers = useMemo(() => {
    if (activeCategoryFilter === 'ALL') return markers;
    return markers.filter(m => m.category === activeCategoryFilter);
  }, [markers, activeCategoryFilter]);

  const getMarkerColor = (marker: MapMarkerItem) => {
    if (marker.riskLevel === 'CRITICAL') {
      return '#DC2626'; // Critical: Red
    }
    if (marker.riskLevel === 'HIGH' || marker.category === 'HIGH_RISK') {
      return '#EA580C'; // High Risk: Orange
    }
    if (marker.category === 'LIVE_MONITORING') {
      return '#6366F1'; // Live Monitoring: Blue/Purple
    }
    if (marker.category === 'INSPECTION') {
      return '#D97706'; // Inspection: Amber
    }
    if (marker.category === 'PROJECT') {
      return '#16A34A'; // Project: Green
    }
    return '#174A73'; // Organization: Navy Blue
  };

  // Update Markers on Google Map
  useEffect(() => {
    if (!googleMapInstance.current || !window.google?.maps || mapMode !== 'google') return;

    // Clear previous markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    filteredMarkers.forEach(item => {
      const color = getMarkerColor(item);
      const isSelected = item.id === selectedMarkerId || item.id === activeMarkerDetail?.id;

      // Clean, bright circular dot on the map
      const svgIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 11 : 8,
        fillColor: color,
        fillOpacity: 1,
        strokeWeight: isSelected ? 3 : 2,
        strokeColor: '#FFFFFF'
      };

      const gMarker = new window.google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: googleMapInstance.current,
        title: `${item.title} (${item.statusText})`,
        icon: svgIcon,
        zIndex: isSelected ? 999 : 10
      });

      gMarker.addListener('click', () => {
        setActiveMarkerDetail(item);
        if (onSelectMarker) {
          onSelectMarker(item);
        }
      });

      markersRef.current.push(gMarker);
    });

    // Auto-pan / fit bounds
    if (selectedMarkerId) {
      const selected = filteredMarkers.find(m => m.id === selectedMarkerId);
      if (selected) {
        googleMapInstance.current.panTo({ lat: selected.lat, lng: selected.lng });
        googleMapInstance.current.setZoom(10);
      }
    } else if (filteredMarkers.length > 0 && window.google?.maps?.LatLngBounds) {
      const bounds = new window.google.maps.LatLngBounds();
      filteredMarkers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
      googleMapInstance.current.fitBounds(bounds);
    }
  }, [filteredMarkers, selectedMarkerId, activeMarkerDetail, onSelectMarker, mapMode]);

  // Synchronize activeMarkerDetail if selectedMarkerId changes externally
  useEffect(() => {
    if (selectedMarkerId) {
      const found = markers.find(m => m.id === selectedMarkerId);
      if (found) {
        setActiveMarkerDetail(found);
      }
    }
  }, [selectedMarkerId, markers]);

  // Render Vector SVG Dot Map Canvas
  const renderVectorDotMap = () => {
    if (filteredMarkers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[420px] text-xs text-[#667085] bg-[#F8FAFC]">
          <MapPin className="w-8 h-8 text-[#CBD5E1] mb-2" />
          <span>No coordinate markers available to plot for this filter.</span>
        </div>
      );
    }

    const lats = filteredMarkers.map(m => m.lat);
    const lngs = filteredMarkers.map(m => m.lng);
    const minLat = Math.min(...lats) - 0.7;
    const maxLat = Math.max(...lats) + 0.7;
    const minLng = Math.min(...lngs) - 1.0;
    const maxLng = Math.max(...lngs) + 1.0;

    const latSpan = Math.max(maxLat - minLat, 0.5);
    const lngSpan = Math.max(maxLng - minLng, 0.5);

    const svgWidth = 840;
    const svgHeight = 440;
    const padX = 80;
    const padY = 50;
    const plotWidth = svgWidth - padX * 2;
    const plotHeight = svgHeight - padY * 2;

    const getX = (lng: number) => padX + ((lng - minLng) / lngSpan) * plotWidth;
    const getY = (lat: number) => padY + ((maxLat - lat) / latSpan) * plotHeight;

    return (
      <div className="relative w-full h-[460px] bg-gradient-to-b from-[#F0F5FA] to-[#E9EFF6] rounded-md overflow-hidden flex items-center justify-center select-none border border-[#CBD5E1]">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle GIS Coordinate Grid */}
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width={svgWidth} height={svgHeight} fill="url(#grid-pattern)" />

          {/* Latitude / Longitude Guide Lines */}
          {[0.25, 0.5, 0.75].map(ratio => {
            const latVal = (minLat + ratio * latSpan).toFixed(2);
            const lngVal = (minLng + ratio * lngSpan).toFixed(2);
            const gy = padY + ratio * plotHeight;
            const gx = padX + ratio * plotWidth;
            return (
              <g key={ratio} opacity="0.6">
                <line x1={padX} y1={gy} x2={svgWidth - padX} y2={gy} stroke="#CBD5E1" strokeDasharray="3 3" />
                <text x={padX - 8} y={gy + 3} textAnchor="end" className="text-[9px] fill-[#94A3B8] font-mono">
                  {latVal}°N
                </text>
                <line x1={gx} y1={padY} x2={gx} y2={svgHeight - padY} stroke="#CBD5E1" strokeDasharray="3 3" />
                <text x={gx} y={svgHeight - padY + 14} textAnchor="middle" className="text-[9px] fill-[#94A3B8] font-mono">
                  {lngVal}°E
                </text>
              </g>
            );
          })}

          {/* Connecting line between markers if related */}
          {filteredMarkers.length > 1 && (
            <polyline
              points={filteredMarkers.map(m => `${getX(m.lng)},${getY(m.lat)}`).join(' ')}
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.7"
            />
          )}

          {/* Render Location Dots */}
          {filteredMarkers.map(marker => {
            const cx = getX(marker.lng);
            const cy = getY(marker.lat);
            const isSelected = marker.id === selectedMarkerId || marker.id === activeMarkerDetail?.id;
            const color = getMarkerColor(marker);

            return (
              <g
                key={marker.id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => {
                  setActiveMarkerDetail(marker);
                  onSelectMarker?.(marker);
                }}
              >
                {/* Outer Subtle Indicator Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 16 : 10}
                  fill={color}
                  opacity={isSelected ? 0.25 : 0.15}
                />

                {/* Second Radial Ping Ring for Selected */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={24}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.4"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Solid Center Location Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 8 : 6}
                  fill={color}
                  stroke="#FFFFFF"
                  strokeWidth={isSelected ? 3 : 2}
                  className="filter drop-shadow-md"
                />

                {/* Category Pin Badge Indicator */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={2.5}
                  fill="#FFFFFF"
                />

                {/* Text Label next to the dot */}
                <g transform={`translate(${cx}, ${cy + (isSelected ? 22 : 18)})`}>
                  {/* Label Backdrop */}
                  <rect
                    x={-(marker.title.length * 3.6)}
                    y={-12}
                    width={marker.title.length * 7.2}
                    height={18}
                    rx={4}
                    fill={isSelected ? '#174A73' : '#FFFFFF'}
                    stroke={isSelected ? '#174A73' : '#CBD5E1'}
                    strokeWidth="1"
                    className="filter drop-shadow-xs"
                  />
                  <text
                    x={0}
                    y={1}
                    textAnchor="middle"
                    className={`text-[10px] font-bold ${isSelected ? 'fill-white' : 'fill-[#1F2937]'}`}
                  >
                    {marker.title}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* Floating Coordinates Tag */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-[#CBD5E1] rounded-md px-2.5 py-1 text-[11px] text-[#475569] font-mono shadow-2xs flex items-center space-x-1.5">
          <Compass className="w-3.5 h-3.5 text-[#174A73]" />
          <span>Interactive Vector Geo-Coordinate Map</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#E2E5E9] rounded-xl shadow-xs overflow-hidden flex flex-col">
      {/* Map Header & Filter Toolbar */}
      <div className="p-3.5 border-b border-[#E2E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-[#1F2937]">
              {title}
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#174A73] border border-blue-100">
              {filteredMarkers.length} Active Dot Pins
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Geographic overview with pulsating location dots for headquarters and project sites.
          </p>
        </div>

        {/* View Mode Switcher & Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer Mode Toggle */}
          <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
                mapMode === 'google'
                  ? 'bg-white text-[#174A73] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Satellite Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapMode('vector')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center space-x-1 ${
                mapMode === 'vector'
                  ? 'bg-white text-[#174A73] shadow-2xs'
                  : 'text-[#64748B] hover:text-[#1E293B]'
              }`}
            >
              <MapPin className="w-3 h-3 text-red-500" />
              <span>Vector Dot Map</span>
            </button>
          </div>

          {showFilters && (
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('ALL')}
                className={`px-2 py-1 rounded text-xs font-medium border transition ${
                  activeCategoryFilter === 'ALL'
                    ? 'bg-[#174A73] text-white border-[#174A73]'
                    : 'bg-white text-[#667085] border-[#E2E5E9] hover:bg-[#F7F8FA]'
                }`}
              >
                All ({markers.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('NGO')}
                className={`px-2 py-1 rounded text-xs font-medium border transition ${
                  activeCategoryFilter === 'NGO'
                    ? 'bg-[#174A73] text-white border-[#174A73]'
                    : 'bg-white text-[#667085] border-[#E2E5E9] hover:bg-[#F7F8FA]'
                }`}
              >
                NGO HQ
              </button>
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('PROJECT')}
                className={`px-2 py-1 rounded text-xs font-medium border transition ${
                  activeCategoryFilter === 'PROJECT'
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : 'bg-white text-[#667085] border-[#E2E5E9] hover:bg-[#F7F8FA]'
                }`}
              >
                Projects
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map Canvas and Fallback / Detail Layout */}
      <div className="relative">
        {mapMode === 'vector' || loadError ? (
          renderVectorDotMap()
        ) : (
          <div ref={mapRef} className={className} />
        )}

        {/* Clean Detail Popup when a marker is clicked */}
        {activeMarkerDetail && (
          <div className="absolute top-4 right-4 z-10 w-72 bg-white/95 backdrop-blur-md border border-[#CBD5E1] rounded-xl shadow-lg p-4 text-xs animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9.5px] uppercase font-bold text-[#174A73] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 tracking-wide">
                  {activeMarkerDetail.category === 'NGO' ? 'NGO Headquarters' : activeMarkerDetail.category}
                </span>
                <h4 className="font-bold text-sm text-[#1F2937] mt-1.5">
                  {activeMarkerDetail.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveMarkerDetail(null)}
                className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-md hover:bg-gray-100 text-xs"
                title="Close"
              >
                ✕
              </button>
            </div>
            <p className="text-[#64748B] mt-1.5 leading-relaxed">{activeMarkerDetail.subtitle}</p>

            <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">Coordinates:</span>
                <span className="font-mono font-medium text-[#1F2937]">
                  {activeMarkerDetail.lat.toFixed(4)}°N, {activeMarkerDetail.lng.toFixed(4)}°E
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[#64748B]">Operational Status:</span>
                <span className="font-bold text-[#16A34A]">{activeMarkerDetail.statusText}</span>
              </div>

              {activeMarkerDetail.riskLevel && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">Risk Level:</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      activeMarkerDetail.riskLevel === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : activeMarkerDetail.riskLevel === 'HIGH'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : activeMarkerDetail.riskLevel === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {activeMarkerDetail.riskLevel}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Clean Bottom Legend */}
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E5E9] flex flex-wrap items-center justify-between gap-3 text-xs text-[#667085]">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-[#1F2937]">Location Dot Legend:</span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#174A73] border-2 border-white shadow-2xs"></span>
            <span className="font-medium text-[#334155]">NGO Headquarters</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white shadow-2xs"></span>
            <span className="font-medium text-[#334155]">Approved Project Site</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#D97706] border-2 border-white shadow-2xs"></span>
            <span className="font-medium text-[#334155]">Active Inspection</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-[#DC2626] border-2 border-white shadow-2xs"></span>
            <span className="font-medium text-[#334155]">Critical / High Risk</span>
          </span>
        </div>

        <div className="text-[11px] text-[#64748B] font-mono">
          Plotting {filteredMarkers.length} verified geographic coordinates
        </div>
      </div>
    </div>
  );
};
