'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  YARD_BOUNDARY,
  INITIAL_ZONES,
  INITIAL_PATHS,
  INITIAL_LOADERS,
  getCapacityColor,
  getCapacityPct,
  interpolateAlongPath,
  ZONE_TYPE_INFO,
  type Zone,
  type Path,
  type Loader,
  type LatLng,
} from '@/lib/yardData';

// ============================================================
// TYPES
// ============================================================
interface ZoneState extends Zone {
  polygon: LatLng[];
}

interface LoaderState extends Loader {
  position?: LatLng;
}

// Using `any` for dynamically-imported Leaflet to avoid SSR type conflicts
 
type LeafletLib = any;
 
type LeafletMap = any;
 
type LeafletLayer = any;

// ============================================================
// COMPONENT
// ============================================================
export default function TimberYardMap() {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const zoneLayersRef = useRef<Map<string, LeafletLayer>>(new Map());
  const pathLayersRef = useRef<Map<string, LeafletLayer>>(new Map());
  const loaderMarkersRef = useRef<Map<string, LeafletLayer>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);
  const leafletRef = useRef<LeafletLib | null>(null);

  const [zones, setZones] = useState<ZoneState[]>(INITIAL_ZONES as ZoneState[]);
  const [paths] = useState<Path[]>(INITIAL_PATHS);
  const [loaders, setLoaders] = useState<LoaderState[]>(INITIAL_LOADERS);
  const [selectedZone, setSelectedZone] = useState<ZoneState | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [tick, setTick] = useState(0);
  const [showPaths, setShowPaths] = useState(true);
  const [showLoaders, setShowLoaders] = useState(true);

  // ---- Draw Zones ----
  const drawZones = useCallback(
    (L: LeafletLib, map: LeafletMap, zoneList: ZoneState[]) => {
      // Remove old zone layers
      zoneLayersRef.current.forEach((layer) => {
        try { map.removeLayer(layer); } catch { /* ignore */ }
      });
      zoneLayersRef.current.clear();

      zoneList.forEach((zone) => {
        // Display all zones as normal - locked property controls path access, not display
        const fillColor = getCapacityColor(zone.currentStock, zone.maxCapacity);

        const poly = L.polygon(zone.polygon, {
          color: '#ffffff',
          weight: 1.5,
          fillColor,
          fillOpacity: 0.65,
        }).addTo(map);

        // Zone label
        const center = poly.getBounds().getCenter();
        const pct = getCapacityPct(zone.currentStock, zone.maxCapacity);
        const typeInfo = ZONE_TYPE_INFO[zone.type] || { icon: '📍', label: zone.type };

        const labelHtml = zone.locked
          ? `<div class="zone-label">
              <span class="zone-icon">${typeInfo.icon}</span>
              <span class="zone-name">${zone.name}</span>
            </div>`
          : `<div class="zone-label">
              <span class="zone-icon">${typeInfo.icon}</span>
              <span class="zone-name">${zone.name}</span>
              ${zone.logType ? `<span class="zone-logtype">${zone.logType}</span>` : ''}
              <span class="zone-capacity" style="color:${getCapacityColor(zone.currentStock, zone.maxCapacity)}">${pct}%</span>
            </div>`;

        L.marker(center, {
          icon: L.divIcon({
            html: labelHtml,
            className: '',
            iconSize: [120, 60],
            iconAnchor: [60, 30],
          }),
          interactive: false,
        }).addTo(map);

        poly.on('click', () => {
          setSelectedZone(zone);
        });

        poly.bindTooltip(
          `<b>${zone.name}</b><br/>${typeInfo.label}${zone.logType ? `<br/>Type: ${zone.logType}` : ''}<br/>Stock: ${zone.currentStock}/${zone.maxCapacity} (${pct}%)`,
          { sticky: true }
        );

        zoneLayersRef.current.set(zone.id, poly);
      });
    },
    []
  );

  // ---- Draw Paths ----
  const drawPaths = useCallback(
    (L: LeafletLib, map: LeafletMap, pathList: Path[]) => {
      pathLayersRef.current.forEach((layer) => {
        try { map.removeLayer(layer); } catch { /* ignore */ }
      });
      pathLayersRef.current.clear();

      pathList.forEach((path) => {
        const line = L.polyline(path.points, {
          color: path.color || '#f59e0b',
          weight: 3,
          opacity: showPaths ? 0.85 : 0,
          dashArray: '10 5',
        }).addTo(map);

        line.bindTooltip(`→ ${path.name}`, { sticky: true });

        // Add directional arrow at midpoint
        if (path.points.length >= 2) {
          const midIdx = Math.floor(path.points.length / 2);
          const p1 = path.points[midIdx - 1] || path.points[0];
          const p2 = path.points[midIdx];
          const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * (180 / Math.PI);

          L.marker([p2[0], p2[1]], {
            icon: L.divIcon({
              html: `<div style="transform:rotate(${angle}deg);color:${path.color || '#f59e0b'};font-size:16px;line-height:1;opacity:${showPaths ? 1 : 0}">➤</div>`,
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
            interactive: false,
          }).addTo(map);
        }

        pathLayersRef.current.set(path.id, line);
      });
    },
    [showPaths]
  );

  // ---- Draw Loaders ----
  const drawLoaders = useCallback(
    (L: LeafletLib, map: LeafletMap, loaderList: LoaderState[]) => {
      loaderMarkersRef.current.forEach((m) => {
        try { map.removeLayer(m); } catch { /* ignore */ }
      });
      loaderMarkersRef.current.clear();

      loaderList.forEach((loader) => {
        const path = INITIAL_PATHS.find((p) => p.id === loader.pathId);
        if (!path) return;

        const pos = interpolateAlongPath(path.points, loader.progress);

        // Different icon for Wagner loader
        const isWagner = loader.canAccessStemZone;
        const loaderIcon = isWagner ? '🚜' : '🚜';
        const loaderName = isWagner ? 'WAGNER' : '';

        const marker = L.marker(pos, {
          icon: L.divIcon({
            html: `<div class="loader-marker" style="background:${loader.color}">
              <span class="loader-icon">${loaderIcon}</span>
              <span class="loader-load">${loader.carryingLogs}/${loader.maxLoad}</span>
            </div>`,
            className: '',
            iconSize: isWagner ? [52, 52] : [44, 44],
            iconAnchor: isWagner ? [26, 26] : [22, 22],
          }),
          zIndexOffset: isWagner ? 1100 : 1000,
          opacity: showLoaders ? 1 : 0,
        }).addTo(map);

        marker.bindTooltip(
          `<b>${loader.name}</b><br/>Load: ${loader.carryingLogs}/${loader.maxLoad}<br/>Status: ${loader.status}`,
          { sticky: true }
        );

        loaderMarkersRef.current.set(loader.id, marker);
      });
    },
    [showLoaders]
  );

  // ---- Initialize Leaflet Map ----
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      leafletRef.current = L;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as LeafletLib)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapContainerRef.current) return;

      const centerLat = -38.41115;
      const centerLng = 176.54750;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      });

      // Satellite tile layer
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 20,
        }
      ).addTo(map);

      // Yard boundary
      L.polygon(YARD_BOUNDARY, {
        color: '#facc15',
        weight: 3,
        fillColor: 'transparent',
        fillOpacity: 0,
        dashArray: '8 4',
      })
        .addTo(map)
        .bindTooltip('Yard Boundary', { permanent: false, direction: 'center' });

      mapRef.current = map;

      // Draw initial layers
      drawZones(L, map, INITIAL_ZONES as ZoneState[]);
      drawPaths(L, map, INITIAL_PATHS);
      drawLoaders(L, map, INITIAL_LOADERS);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Animation Loop ----
  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      if (timestamp - lastTickRef.current < 50) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTickRef.current = timestamp;

      setLoaders((prev) => {
        return prev.map((loader) => {
          const path = paths.find((p) => p.id === loader.pathId);
          if (!path) return loader;

          // Check if path has loader restrictions
          if (path.allowedLoaderIds && !path.allowedLoaderIds.includes(loader.id)) {
            // Loader not allowed on this path - try to find alternative or stay idle
            return loader;
          }

          let newProgress = loader.progress + loader.speed;
          let newStatus = loader.status;
          let newCarrying = loader.carryingLogs;
          let newPathId = loader.pathId;

          if (newProgress >= 1) {
            // Check if this loader has a path sequence (like Wagner)
            if (loader.pathSequence && loader.pathSequence.length > 0) {
              const currentIndex = loader.pathSequence.indexOf(loader.pathId);
              const nextIndex = (currentIndex + 1) % loader.pathSequence.length;
              newPathId = loader.pathSequence[nextIndex];
              newProgress = 0;
              
              // Toggle carrying logs - load when in stemzone, unload in production
              if (newPathId === 'path-wagner-stem-to-production') {
                newCarrying = loader.maxLoad; // Loaded with stems
                newStatus = 'moving';
              } else if (newPathId === 'path-wagner-production-to-stem') {
                newCarrying = 0; // Unloaded at production
                newStatus = 'moving';
              } else {
                newStatus = 'moving';
              }
            } else {
              // Regular loader - reset to start of same path
              newProgress = 0;
              newStatus = 'loading';
              newCarrying = Math.floor(Math.random() * loader.maxLoad) + 1;
            }
          }

          if (loader.status === 'loading' && newProgress > 0.05) {
            newStatus = 'moving';
          }

          return {
            ...loader,
            pathId: newPathId,
            progress: newProgress,
            status: newStatus,
            carryingLogs: newCarrying,
            position: interpolateAlongPath(paths.find(p => p.id === newPathId)?.points || path.points, newProgress),
          };
        });
      });

      setTick((t) => t + 1);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, paths]);

  // ---- Sync loader positions to map ----
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    loaders.forEach((loader) => {
      const path = paths.find((p) => p.id === loader.pathId);
      if (!path) return;

      const pos = interpolateAlongPath(path.points, loader.progress);
      const existing = loaderMarkersRef.current.get(loader.id);
      const isWagner = loader.canAccessStemZone;

      if (existing) {
        existing.setLatLng(pos);
        existing.setIcon(
          L.divIcon({
            html: `<div class="loader-marker" style="background:${loader.color}">
              <span class="loader-icon">${loader.status === 'loading' ? '⏳' : '🚜'}</span>
              <span class="loader-load">${loader.carryingLogs}/${loader.maxLoad}</span>
            </div>`,
            className: '',
            iconSize: isWagner ? [52, 52] : [44, 44],
            iconAnchor: isWagner ? [26, 26] : [22, 22],
          })
        );
        existing.setOpacity(showLoaders ? 1 : 0);
      } else {
        const marker = L.marker(pos, {
          icon: L.divIcon({
            html: `<div class="loader-marker" style="background:${loader.color}">
              <span class="loader-icon">🚜</span>
              <span class="loader-load">${loader.carryingLogs}/${loader.maxLoad}</span>
            </div>`,
            className: '',
            iconSize: isWagner ? [52, 52] : [44, 44],
            iconAnchor: isWagner ? [26, 26] : [22, 22],
          }),
          zIndexOffset: isWagner ? 1100 : 1000,
          opacity: showLoaders ? 1 : 0,
        }).addTo(map);
        loaderMarkersRef.current.set(loader.id, marker);
      }
    });
  }, [loaders, paths, showLoaders]);

  // ---- Toggle path visibility ----
  useEffect(() => {
    pathLayersRef.current.forEach((layer) => {
      layer.setStyle({ opacity: showPaths ? 0.85 : 0 });
    });
  }, [showPaths]);

  // ---- Toggle loader visibility ----
  useEffect(() => {
    loaderMarkersRef.current.forEach((marker) => {
      marker.setOpacity(showLoaders ? 1 : 0);
    });
  }, [showLoaders]);

  // ---- Simulate live inventory changes ----
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setZones((prev) =>
        prev.map((zone) => {
          if (zone.locked) return zone;
          const delta = Math.floor(Math.random() * 5) - 2;
          const newStock = Math.max(0, Math.min(zone.maxCapacity, zone.currentStock + delta));
          return { ...zone, currentStock: newStock };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // ---- Redraw zones when stock changes ----
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    drawZones(L, map, zones);
  }, [zones, drawZones]);

  // ---- Redraw paths when visibility changes ----
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    drawPaths(L, map, paths);
  }, [paths, showPaths, drawPaths]);

  // ---- Adjust stock manually ----
  const adjustStock = (zoneId: string, delta: number) => {
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const newStock = Math.max(0, Math.min(z.maxCapacity, z.currentStock + delta));
        return { ...z, currentStock: newStock };
      })
    );
    setSelectedZone((prev) => {
      if (!prev || prev.id !== zoneId) return prev;
      const newStock = Math.max(0, Math.min(prev.maxCapacity, prev.currentStock + delta));
      return { ...prev, currentStock: newStock };
    });
  };

  // ---- Stats ----
  const totalLogs = zones
    .filter((z) => !z.locked)
    .reduce((sum, z) => sum + z.currentStock, 0);
  const totalCapacity = zones
    .filter((z) => !z.locked)
    .reduce((sum, z) => sum + z.maxCapacity, 0);
  const criticalZones = zones.filter(
    (z) => !z.locked && z.maxCapacity > 0 && z.currentStock / z.maxCapacity > 0.9
  );

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* ---- HEADER ---- */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🪵</span>
          <div>
            <h1 className="text-lg font-bold text-amber-400 leading-tight">
              Timber Yard Management System
            </h1>
            <p className="text-xs text-gray-400">
              GPS-Based Operations Dashboard · Rotorua, NZ
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}
            />
            <span className="text-xs text-gray-300">{isRunning ? 'LIVE' : 'PAUSED'}</span>
          </div>
          <button
            onClick={() => setIsRunning((r) => !r)}
            className={`px-3 py-1 rounded text-xs font-semibold ${isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={() => setShowPaths((s) => !s)}
            className={`px-3 py-1 rounded text-xs font-semibold ${showPaths ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          >
            {showPaths ? '🛤 Paths ON' : '🛤 Paths OFF'}
          </button>
          <button
            onClick={() => setShowLoaders((s) => !s)}
            className={`px-3 py-1 rounded text-xs font-semibold ${showLoaders ? 'bg-amber-600 hover:bg-amber-700' : 'bg-gray-600 hover:bg-gray-700'}`}
          >
            {showLoaders ? '🚜 Loaders ON' : '🚜 Loaders OFF'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ---- LEFT SIDEBAR ---- */}
        <aside className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
          {/* Stats */}
          <div className="p-3 border-b border-gray-700">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Yard Overview
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Total Logs</div>
                <div className="text-xl font-bold text-amber-400">{totalLogs}</div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Capacity</div>
                <div className="text-xl font-bold text-blue-400">
                  {totalCapacity > 0 ? Math.round((totalLogs / totalCapacity) * 100) : 0}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Active Loaders</div>
                <div className="text-xl font-bold text-green-400">
                  {loaders.filter((l) => l.status === 'moving').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-xs text-gray-400">Critical Zones</div>
                <div
                  className={`text-xl font-bold ${criticalZones.length > 0 ? 'text-red-400' : 'text-green-400'}`}
                >
                  {criticalZones.length}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="px-3 py-2 border-b border-gray-700">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Overall Capacity</span>
              <span>
                {totalLogs}/{totalCapacity}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, totalCapacity > 0 ? (totalLogs / totalCapacity) * 100 : 0)}%`,
                  backgroundColor: getCapacityColor(totalLogs, totalCapacity),
                }}
              />
            </div>
          </div>

          {/* Zone list */}
          <div className="flex-1 overflow-y-auto p-2">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              Zones
            </h2>
            {zones
              .filter((z) => !z.locked)
              .map((zone) => {
                const pct = getCapacityPct(zone.currentStock, zone.maxCapacity);
                const capColor = getCapacityColor(zone.currentStock, zone.maxCapacity);
                const typeInfo = ZONE_TYPE_INFO[zone.type] || { icon: '📍', label: zone.type };
                return (
                  <div
                    key={zone.id}
                    onClick={() => setSelectedZone(zone)}
                    className={`mb-1 p-2 rounded cursor-pointer border transition-all ${
                      selectedZone?.id === zone.id
                        ? 'border-amber-400 bg-gray-700'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm">{typeInfo.icon}</span>
                        <span className="text-xs font-medium text-white truncate max-w-[120px]">
                          {zone.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: capColor + '33', color: capColor }}
                      >
                        {pct}%
                      </span>
                    </div>
                    {zone.logType && (
                      <div className="text-xs text-gray-400 mb-1">{zone.logType}</div>
                    )}
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: capColor }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {zone.currentStock} / {zone.maxCapacity} logs
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Loader status */}
          <div className="p-2 border-t border-gray-700 flex-shrink-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Loaders
            </h2>
            <div className="space-y-1">
              {loaders.map((loader) => (
                <div
                  key={loader.id}
                  className="flex items-center gap-2 bg-gray-800 rounded p-1.5"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: loader.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{loader.name}</div>
                    <div className="text-xs text-gray-400">
                      {loader.status === 'loading'
                        ? '⏳ Loading...'
                        : `🚜 ${Math.round(loader.progress * 100)}%`}
                    </div>
                  </div>
                  <div className="text-xs text-amber-400 font-bold">
                    {loader.carryingLogs}/{loader.maxLoad}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ---- MAP ---- */}
        <main className="flex-1 relative overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Legend overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur rounded-lg p-3 text-xs z-[1000] border border-gray-700 pointer-events-none">
            <div className="font-semibold text-gray-300 mb-2">Legend</div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600 flex-shrink-0" />
                <span className="text-gray-300">{'Capacity < 70%'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500 flex-shrink-0" />
                <span className="text-gray-300">Capacity 70–90%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-600 flex-shrink-0" />
                <span className="text-gray-300">{'Capacity > 90%'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0 border-t-2 border-dashed border-amber-400 flex-shrink-0" />
                <span className="text-gray-300">Loader Path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚜</span>
                <span className="text-gray-300">Active Loader</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🚜</span>
                <span className="text-red-400 font-bold">Wagner (Stem Zone)</span>
              </div>
            </div>
          </div>

          {/* Tick counter */}
          <div className="absolute top-2 right-2 bg-gray-900/80 rounded px-2 py-1 text-xs text-gray-400 z-[1000] pointer-events-none">
            Tick #{tick}
          </div>

          {/* Zone type legend */}
          <div className="absolute top-2 left-2 bg-gray-900/90 backdrop-blur rounded-lg p-2 text-xs z-[1000] border border-gray-700 pointer-events-none">
            <div className="font-semibold text-gray-300 mb-1.5">Zone Types</div>
            <div className="space-y-1">
              {Object.entries(ZONE_TYPE_INFO)
                .filter(([k]) => !['production', 'stem'].includes(k))
                .map(([key, info]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span>{info.icon}</span>
                    <span className="text-gray-400">{info.label}</span>
                  </div>
                ))}
            </div>
          </div>
        </main>

        {/* ---- RIGHT PANEL (Zone Detail) ---- */}
        {selectedZone && (
          <aside className="w-64 bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
            <div className="p-3 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-bold text-amber-400">Zone Details</h2>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-gray-400 hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Zone info */}
              <div className="bg-gray-800 rounded p-3">
                <div className="text-lg mb-1">
                  {ZONE_TYPE_INFO[selectedZone.type]?.icon || '📍'}
                </div>
                <div className="font-bold text-white">{selectedZone.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {ZONE_TYPE_INFO[selectedZone.type]?.label || selectedZone.type}
                </div>
                {selectedZone.description && (
                  <div className="text-xs text-gray-500 mt-1">{selectedZone.description}</div>
                )}
              </div>

              {/* Log type */}
              {selectedZone.logType && (
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-xs text-gray-400 mb-1">Log Type</div>
                  <div className="font-semibold text-green-400">{selectedZone.logType}</div>
                </div>
              )}

              {/* Capacity */}
              {!selectedZone.locked && (
                <div className="bg-gray-800 rounded p-3">
                  <div className="text-xs text-gray-400 mb-2">Inventory</div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-white">
                      {selectedZone.currentStock}
                    </span>
                    <span className="text-gray-400">/ {selectedZone.maxCapacity}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${getCapacityPct(selectedZone.currentStock, selectedZone.maxCapacity)}%`,
                        backgroundColor: getCapacityColor(
                          selectedZone.currentStock,
                          selectedZone.maxCapacity
                        ),
                      }}
                    />
                  </div>
                  <div
                    className="text-center text-sm font-bold"
                    style={{
                      color: getCapacityColor(
                        selectedZone.currentStock,
                        selectedZone.maxCapacity
                      ),
                    }}
                  >
                    {getCapacityPct(selectedZone.currentStock, selectedZone.maxCapacity)}% Full
                  </div>

                  {/* Manual adjust */}
                  <div className="mt-3">
                    <div className="text-xs text-gray-400 mb-1">Manual Adjust</div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => adjustStock(selectedZone.id, -10)}
                        className="flex-1 bg-red-800 hover:bg-red-700 rounded py-1 text-xs font-bold"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => adjustStock(selectedZone.id, -1)}
                        className="flex-1 bg-red-900 hover:bg-red-800 rounded py-1 text-xs font-bold"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => adjustStock(selectedZone.id, 1)}
                        className="flex-1 bg-green-900 hover:bg-green-800 rounded py-1 text-xs font-bold"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => adjustStock(selectedZone.id, 10)}
                        className="flex-1 bg-green-800 hover:bg-green-700 rounded py-1 text-xs font-bold"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* GPS Coordinates */}
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">GPS Polygon</div>
                <div className="space-y-0.5 max-h-32 overflow-y-auto">
                  {selectedZone.polygon.map((pt, i) => (
                    <div key={i} className="text-xs font-mono text-gray-500">
                      {pt[0].toFixed(6)}, {pt[1].toFixed(6)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected paths */}
              <div className="bg-gray-800 rounded p-3">
                <div className="text-xs text-gray-400 mb-2">Connected Paths</div>
                <div className="space-y-1">
                  {paths
                    .filter(
                      (p) =>
                        p.fromZoneId === selectedZone.id || p.toZoneId === selectedZone.id
                    )
                    .map((p) => (
                      <div key={p.id} className="text-xs text-gray-300 flex items-center gap-1">
                        <span style={{ color: p.color || '#f59e0b' }}>→</span>
                        <span className="truncate">{p.name}</span>
                      </div>
                    ))}
                  {paths.filter(
                    (p) =>
                      p.fromZoneId === selectedZone.id || p.toZoneId === selectedZone.id
                  ).length === 0 && (
                    <div className="text-xs text-gray-500">No paths connected</div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ---- ALERTS BAR ---- */}
      {criticalZones.length > 0 && (
        <div className="bg-red-900/80 border-t border-red-700 px-4 py-1.5 flex items-center gap-3 flex-shrink-0">
          <span className="text-red-300 text-xs font-bold animate-pulse">⚠ CRITICAL:</span>
          <div className="flex gap-3 overflow-x-auto">
            {criticalZones.map((z) => (
              <span key={z.id} className="text-xs text-red-200 whitespace-nowrap">
                {z.name} ({getCapacityPct(z.currentStock, z.maxCapacity)}% full)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
