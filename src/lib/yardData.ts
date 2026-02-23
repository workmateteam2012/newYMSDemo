// ============================================================
// TIMBER YARD MANAGEMENT SYSTEM - GPS DATA
// All coordinates: [lat, lng] format
// Yard is in Rotorua, New Zealand area
// ============================================================

export type LatLng = [number, number];

export interface Zone {
  id: string;
  name: string;
  type: 'log' | 'sorting' | 'buffer' | 'truck' | 'overflow' | 'production' | 'stem';
  polygon: LatLng[];
  logType?: string;
  maxCapacity: number;
  currentStock: number;
  color: string;
  locked?: boolean;
  description?: string;
}

export interface Path {
  id: string;
  name: string;
  points: LatLng[];
  fromZoneId: string;
  toZoneId: string;
  direction: 'one-way';
  color?: string;
}

export interface Loader {
  id: string;
  name: string;
  pathId: string;
  progress: number; // 0-1 along path
  speed: number; // units per tick
  status: 'idle' | 'moving' | 'loading' | 'unloading';
  carryingLogs: number;
  maxLoad: number;
  color: string;
  currentSegment: number;
}

// ============================================================
// YARD BOUNDARY (GPS Polygon)
// ============================================================
export const YARD_BOUNDARY: LatLng[] = [
  [-38.408620464458764, 176.54446549122207],
  [-38.40851957899993, 176.5460104435841],
  [-38.408385064835734, 176.54607481659917],
  [-38.40851957899993, 176.54753393827443],
  [-38.40873816398274, 176.54828495678376],
  [-38.410823095204286, 176.54869265254595],
  [-38.4111593688, 176.54975480729485],
  [-38.41168899653996, 176.55060238532675],
  [-38.41368977741324, 176.55060238532675],
  [-38.41372340350915, 176.54447622005793],
  [-38.41122662333135, 176.54441184704285],
  [-38.40869507757191, 176.5443246752518],
  [-38.408620464458764, 176.54446549122207],
];

// ============================================================
// LOCKED / RESTRICTED AREAS
// ============================================================

// 2.1 Stem Zones (Locked - NO PATHS ALLOWED THROUGH)
export const STEM_ZONE_POLYGON: LatLng[] = [
  [-38.408500137452926, 176.5460647583282],
  [-38.40860943005638, 176.54808177946748],
  [-38.4109297570927, 176.548328542692],
  [-38.41092135024517, 176.5460003853131],
  [-38.40855898733686, 176.54576435092446],
  [-38.409391287735225, 176.54447689062218],
  [-38.408500137452926, 176.5460647583282],
];

// 2.2 Production House (Locked - NO PATHS THROUGH INTERIOR)
export const PRODUCTION_HOUSE_POLYGON: LatLng[] = [
  [-38.409357659605526, 176.54604330065246],
  [-38.413056658103805, 176.54597892763738],
  [-38.413056658103805, 176.54532446865068],
  [-38.40898774934143, 176.5451528072771],
  [-38.409357659605526, 176.54604330065246],
];

// ============================================================
// OPERATIONAL ZONES (Inside yard, outside locked areas)
// ============================================================
//
// Available space analysis:
//   - South area: lat -38.4113 to -38.4137, lng 176.5445 to 176.5506
//     (large open area below both locked zones)
//   - East of stem zone: lat -38.4087 to -38.4108, lng 176.5484 to ~176.5487
//     (narrow strip, yard boundary limits eastward extent)
//   - North-east: lat -38.4084 to -38.4087, lng 176.5476 to 176.5483
//     (small triangle above stem zone)
//
// All 12 operational zones are placed in the south area for clarity.
// Zone size: ~0.0003 lat x 0.0012 lng (~33m x 95m)
// ============================================================

export const INITIAL_ZONES: Zone[] = [
  // ---- LOCKED ZONES (display only) ----
  {
    id: 'stem-zone',
    name: 'Stem Zone',
    type: 'stem',
    polygon: STEM_ZONE_POLYGON,
    maxCapacity: 0,
    currentStock: 0,
    color: '#6b7280',
    locked: true,
    description: 'Restricted - No access',
  },
  {
    id: 'production-house',
    name: 'Production House',
    type: 'production',
    polygon: PRODUCTION_HOUSE_POLYGON,
    maxCapacity: 500,
    currentStock: 320,
    color: '#374151',
    locked: true,
    description: 'Log processing facility',
  },

  // ---- LOG ZONES (Row 1 - top of south area) ----
  // Row 1: lat -38.4115 to -38.4119
  {
    id: 'log-zone-pine-1',
    name: 'Pine Log Zone A',
    type: 'log',
    polygon: [
      [-38.41150, 176.54620],
      [-38.41150, 176.54680],
      [-38.41190, 176.54680],
      [-38.41190, 176.54620],
      [-38.41150, 176.54620],
    ],
    logType: 'Pine',
    maxCapacity: 200,
    currentStock: 120,
    color: '#16a34a',
    locked: false,
    description: 'Primary pine log storage',
  },
  {
    id: 'log-zone-pine-2',
    name: 'Pine Log Zone B',
    type: 'log',
    polygon: [
      [-38.41150, 176.54700],
      [-38.41150, 176.54760],
      [-38.41190, 176.54760],
      [-38.41190, 176.54700],
      [-38.41150, 176.54700],
    ],
    logType: 'Pine',
    maxCapacity: 200,
    currentStock: 175,
    color: '#16a34a',
    locked: false,
    description: 'Secondary pine log storage',
  },
  {
    id: 'log-zone-eucalyptus',
    name: 'Eucalyptus Zone',
    type: 'log',
    polygon: [
      [-38.41150, 176.54780],
      [-38.41150, 176.54840],
      [-38.41190, 176.54840],
      [-38.41190, 176.54780],
      [-38.41150, 176.54780],
    ],
    logType: 'Eucalyptus',
    maxCapacity: 150,
    currentStock: 140,
    color: '#15803d',
    locked: false,
    description: 'Eucalyptus log storage',
  },
  {
    id: 'log-zone-hardwood',
    name: 'Mixed Hardwood Zone',
    type: 'log',
    polygon: [
      [-38.41150, 176.54860],
      [-38.41150, 176.54920],
      [-38.41190, 176.54920],
      [-38.41190, 176.54860],
      [-38.41150, 176.54860],
    ],
    logType: 'Mixed Hardwood',
    maxCapacity: 180,
    currentStock: 60,
    color: '#166534',
    locked: false,
    description: 'Mixed hardwood storage',
  },

  // ---- SORTING ZONES (Row 2) ----
  // Row 2: lat -38.4121 to -38.4125
  {
    id: 'sorting-zone-1',
    name: 'Sorting Zone Alpha',
    type: 'sorting',
    polygon: [
      [-38.41210, 176.54620],
      [-38.41210, 176.54720],
      [-38.41250, 176.54720],
      [-38.41250, 176.54620],
      [-38.41210, 176.54620],
    ],
    maxCapacity: 100,
    currentStock: 45,
    color: '#2563eb',
    locked: false,
    description: 'Primary log sorting area',
  },
  {
    id: 'sorting-zone-2',
    name: 'Sorting Zone Beta',
    type: 'sorting',
    polygon: [
      [-38.41210, 176.54780],
      [-38.41210, 176.54880],
      [-38.41250, 176.54880],
      [-38.41250, 176.54780],
      [-38.41210, 176.54780],
    ],
    maxCapacity: 100,
    currentStock: 80,
    color: '#1d4ed8',
    locked: false,
    description: 'Secondary log sorting area',
  },

  // ---- BUFFER ZONES (Row 3) ----
  // Row 3: lat -38.4127 to -38.4131
  {
    id: 'buffer-zone-1',
    name: 'Buffer Zone North',
    type: 'buffer',
    polygon: [
      [-38.41270, 176.54620],
      [-38.41270, 176.54720],
      [-38.41310, 176.54720],
      [-38.41310, 176.54620],
      [-38.41270, 176.54620],
    ],
    maxCapacity: 80,
    currentStock: 30,
    color: '#7c3aed',
    locked: false,
    description: 'Temporary buffer storage',
  },
  {
    id: 'buffer-zone-2',
    name: 'Buffer Zone East',
    type: 'buffer',
    polygon: [
      [-38.41270, 176.54780],
      [-38.41270, 176.54880],
      [-38.41310, 176.54880],
      [-38.41310, 176.54780],
      [-38.41270, 176.54780],
    ],
    maxCapacity: 80,
    currentStock: 72,
    color: '#6d28d9',
    locked: false,
    description: 'East buffer storage',
  },

  // ---- TRUCK PARKING & LOADING ZONES (Row 4 - bottom of south area) ----
  // Row 4: lat -38.4133 to -38.4137
  {
    id: 'truck-zone-1',
    name: 'Truck Bay 1',
    type: 'truck',
    polygon: [
      [-38.41330, 176.54620],
      [-38.41330, 176.54700],
      [-38.41365, 176.54700],
      [-38.41365, 176.54620],
      [-38.41330, 176.54620],
    ],
    maxCapacity: 60,
    currentStock: 20,
    color: '#b45309',
    locked: false,
    description: 'Truck loading bay 1',
  },
  {
    id: 'truck-zone-2',
    name: 'Truck Bay 2',
    type: 'truck',
    polygon: [
      [-38.41330, 176.54720],
      [-38.41330, 176.54800],
      [-38.41365, 176.54800],
      [-38.41365, 176.54720],
      [-38.41330, 176.54720],
    ],
    maxCapacity: 60,
    currentStock: 55,
    color: '#92400e',
    locked: false,
    description: 'Truck loading bay 2',
  },
  {
    id: 'truck-zone-3',
    name: 'Truck Bay 3',
    type: 'truck',
    polygon: [
      [-38.41330, 176.54820],
      [-38.41330, 176.54920],
      [-38.41365, 176.54920],
      [-38.41365, 176.54820],
      [-38.41330, 176.54820],
    ],
    maxCapacity: 80,
    currentStock: 10,
    color: '#78350f',
    locked: false,
    description: 'Large truck loading bay',
  },

  // ---- OVERFLOW ZONES (east side of south area) ----
  {
    id: 'overflow-zone-1',
    name: 'Overflow Zone East',
    type: 'overflow',
    polygon: [
      [-38.41210, 176.54920],
      [-38.41210, 176.55000],
      [-38.41250, 176.55000],
      [-38.41250, 176.54920],
      [-38.41210, 176.54920],
    ],
    maxCapacity: 120,
    currentStock: 95,
    color: '#dc2626',
    locked: false,
    description: 'Emergency overflow storage',
  },
  {
    id: 'overflow-zone-2',
    name: 'Overflow Zone South-East',
    type: 'overflow',
    polygon: [
      [-38.41270, 176.54920],
      [-38.41270, 176.55000],
      [-38.41310, 176.55000],
      [-38.41310, 176.54920],
      [-38.41270, 176.54920],
    ],
    maxCapacity: 100,
    currentStock: 40,
    color: '#b91c1c',
    locked: false,
    description: 'South-east overflow storage',
  },
];

// ============================================================
// PATHS (One-way, GPS-based, no crossing zones or locked areas)
// All paths route BETWEEN zones using corridors/gaps
//
// Layout corridors (gaps between zone rows):
//   - Horizontal corridor at lat -38.4119 to -38.4121 (between row 1 & 2)
//   - Horizontal corridor at lat -38.4125 to -38.4127 (between row 2 & 3)
//   - Horizontal corridor at lat -38.4131 to -38.4133 (between row 3 & 4)
//   - Vertical corridor at lng 176.5468 to 176.5470 (between left zone pairs)
//   - Vertical corridor at lng 176.5474 to 176.5478 (central gap)
//   - Vertical corridor at lng 176.5488 to 176.5492 (between right zone pairs)
//   - North entry corridor at lat -38.4110 to -38.4115 (from locked areas)
// ============================================================

export const INITIAL_PATHS: Path[] = [
  // ================================================================
  // PRODUCTION HOUSE → LOG ZONES
  // Production house south edge is at lat -38.4131, lng 176.5453-176.5460
  // Route south from production house exit, then east to log zones
  // ================================================================

  // Production House → Pine A
  {
    id: 'path-prod-to-pine-a',
    name: 'Production → Pine A',
    fromZoneId: 'production-house',
    toZoneId: 'log-zone-pine-1',
    direction: 'one-way',
    color: '#f59e0b',
    points: [
      [-38.41305, 176.54598], // Production house south-east corner exit
      [-38.41310, 176.54610], // Step south-east
      [-38.41310, 176.54620], // Into south corridor
      [-38.41200, 176.54620], // North along west edge corridor
      [-38.41190, 176.54620], // Arrive at Pine A south-west corner
      [-38.41170, 176.54650], // Pine A south edge midpoint
    ],
  },

  // Production House → Pine B
  {
    id: 'path-prod-to-pine-b',
    name: 'Production → Pine B',
    fromZoneId: 'production-house',
    toZoneId: 'log-zone-pine-2',
    direction: 'one-way',
    color: '#f59e0b',
    points: [
      [-38.41305, 176.54598], // Production house south-east corner exit
      [-38.41310, 176.54610],
      [-38.41310, 176.54690], // East along corridor
      [-38.41200, 176.54690], // North
      [-38.41190, 176.54700], // Arrive at Pine B south-west corner
      [-38.41170, 176.54730], // Pine B south edge midpoint
    ],
  },

  // Production House → Eucalyptus Zone
  {
    id: 'path-prod-to-eucalyptus',
    name: 'Production → Eucalyptus',
    fromZoneId: 'production-house',
    toZoneId: 'log-zone-eucalyptus',
    direction: 'one-way',
    color: '#f59e0b',
    points: [
      [-38.41305, 176.54598], // Production house south-east corner exit
      [-38.41310, 176.54610],
      [-38.41310, 176.54770], // East along corridor
      [-38.41200, 176.54770], // North
      [-38.41190, 176.54780], // Arrive at Eucalyptus south-west corner
      [-38.41170, 176.54810], // Eucalyptus south edge midpoint
    ],
  },

  // Production House → Hardwood Zone
  {
    id: 'path-prod-to-hardwood',
    name: 'Production → Hardwood',
    fromZoneId: 'production-house',
    toZoneId: 'log-zone-hardwood',
    direction: 'one-way',
    color: '#f59e0b',
    points: [
      [-38.41305, 176.54598], // Production house south-east corner exit
      [-38.41310, 176.54610],
      [-38.41310, 176.54850], // East along corridor
      [-38.41200, 176.54850], // North
      [-38.41190, 176.54860], // Arrive at Hardwood south-west corner
      [-38.41170, 176.54890], // Hardwood south edge midpoint
    ],
  },

  // ================================================================
  // LOG ZONES → SORTING ZONES
  // Route south from log zone row through horizontal corridor to sorting row
  // ================================================================

  // Pine A → Sorting Alpha
  {
    id: 'path-pine-a-to-sorting-1',
    name: 'Pine A → Sorting Alpha',
    fromZoneId: 'log-zone-pine-1',
    toZoneId: 'sorting-zone-1',
    direction: 'one-way',
    color: '#06b6d4',
    points: [
      [-38.41190, 176.54650], // Pine A south edge
      [-38.41200, 176.54650], // Step into corridor
      [-38.41200, 176.54670], // East in corridor
      [-38.41210, 176.54670], // Sorting Alpha north edge
    ],
  },

  // Pine B → Sorting Alpha
  {
    id: 'path-pine-b-to-sorting-1',
    name: 'Pine B → Sorting Alpha',
    fromZoneId: 'log-zone-pine-2',
    toZoneId: 'sorting-zone-1',
    direction: 'one-way',
    color: '#06b6d4',
    points: [
      [-38.41190, 176.54730], // Pine B south edge
      [-38.41200, 176.54730], // Step into corridor
      [-38.41200, 176.54700], // West in corridor
      [-38.41210, 176.54700], // Sorting Alpha north-east edge
    ],
  },

  // Eucalyptus → Sorting Beta
  {
    id: 'path-eucalyptus-to-sorting-2',
    name: 'Eucalyptus → Sorting Beta',
    fromZoneId: 'log-zone-eucalyptus',
    toZoneId: 'sorting-zone-2',
    direction: 'one-way',
    color: '#06b6d4',
    points: [
      [-38.41190, 176.54810], // Eucalyptus south edge
      [-38.41200, 176.54810], // Step into corridor
      [-38.41200, 176.54830], // East in corridor
      [-38.41210, 176.54830], // Sorting Beta north edge
    ],
  },

  // Hardwood → Sorting Beta
  {
    id: 'path-hardwood-to-sorting-2',
    name: 'Hardwood → Sorting Beta',
    fromZoneId: 'log-zone-hardwood',
    toZoneId: 'sorting-zone-2',
    direction: 'one-way',
    color: '#06b6d4',
    points: [
      [-38.41190, 176.54890], // Hardwood south edge
      [-38.41200, 176.54890], // Step into corridor
      [-38.41200, 176.54860], // West in corridor
      [-38.41210, 176.54860], // Sorting Beta north-east edge
    ],
  },

  // ================================================================
  // SORTING ZONES → BUFFER ZONES
  // Route south through corridor between row 2 and row 3
  // ================================================================

  // Sorting Alpha → Buffer North
  {
    id: 'path-sorting-1-to-buffer-1',
    name: 'Sorting Alpha → Buffer North',
    fromZoneId: 'sorting-zone-1',
    toZoneId: 'buffer-zone-1',
    direction: 'one-way',
    color: '#8b5cf6',
    points: [
      [-38.41250, 176.54670], // Sorting Alpha south edge
      [-38.41260, 176.54670], // Step into corridor
      [-38.41270, 176.54670], // Buffer North north edge
    ],
  },

  // Sorting Beta → Buffer East
  {
    id: 'path-sorting-2-to-buffer-2',
    name: 'Sorting Beta → Buffer East',
    fromZoneId: 'sorting-zone-2',
    toZoneId: 'buffer-zone-2',
    direction: 'one-way',
    color: '#8b5cf6',
    points: [
      [-38.41250, 176.54830], // Sorting Beta south edge
      [-38.41260, 176.54830], // Step into corridor
      [-38.41270, 176.54830], // Buffer East north edge
    ],
  },

  // ================================================================
  // BUFFER ZONES → TRUCK BAYS
  // Route south through corridor between row 3 and row 4
  // ================================================================

  // Buffer North → Truck Bay 1
  {
    id: 'path-buffer-1-to-truck-1',
    name: 'Buffer North → Truck Bay 1',
    fromZoneId: 'buffer-zone-1',
    toZoneId: 'truck-zone-1',
    direction: 'one-way',
    color: '#f97316',
    points: [
      [-38.41310, 176.54660], // Buffer North south edge
      [-38.41320, 176.54660], // Step into corridor
      [-38.41330, 176.54660], // Truck Bay 1 north edge
    ],
  },

  // Buffer East → Truck Bay 2
  {
    id: 'path-buffer-2-to-truck-2',
    name: 'Buffer East → Truck Bay 2',
    fromZoneId: 'buffer-zone-2',
    toZoneId: 'truck-zone-2',
    direction: 'one-way',
    color: '#f97316',
    points: [
      [-38.41310, 176.54760], // Buffer East south edge
      [-38.41320, 176.54760], // Step into corridor
      [-38.41330, 176.54760], // Truck Bay 2 north edge
    ],
  },

  // Buffer East → Truck Bay 3
  {
    id: 'path-buffer-2-to-truck-3',
    name: 'Buffer East → Truck Bay 3',
    fromZoneId: 'buffer-zone-2',
    toZoneId: 'truck-zone-3',
    direction: 'one-way',
    color: '#ea580c',
    points: [
      [-38.41310, 176.54850], // Buffer East south-east edge
      [-38.41320, 176.54850], // Step into corridor
      [-38.41320, 176.54870], // East in corridor
      [-38.41330, 176.54870], // Truck Bay 3 north edge
    ],
  },

  // ================================================================
  // OVERFLOW ZONE CONNECTIONS
  // ================================================================

  // Overflow East → Sorting Beta (emergency feed)
  {
    id: 'path-overflow-e-to-sorting-2',
    name: 'Overflow East → Sorting Beta',
    fromZoneId: 'overflow-zone-1',
    toZoneId: 'sorting-zone-2',
    direction: 'one-way',
    color: '#ef4444',
    points: [
      [-38.41230, 176.54920], // Overflow East west edge
      [-38.41230, 176.54900], // West in corridor
      [-38.41230, 176.54880], // Sorting Beta east edge
    ],
  },

  // Overflow South-East → Buffer East (emergency feed)
  {
    id: 'path-overflow-se-to-buffer-2',
    name: 'Overflow SE → Buffer East',
    fromZoneId: 'overflow-zone-2',
    toZoneId: 'buffer-zone-2',
    direction: 'one-way',
    color: '#ef4444',
    points: [
      [-38.41290, 176.54920], // Overflow SE west edge
      [-38.41290, 176.54900], // West in corridor
      [-38.41290, 176.54880], // Buffer East east edge
    ],
  },
];

// ============================================================
// INITIAL LOADERS
// Positioned on valid paths (not inside zones or locked areas)
// ============================================================

export const INITIAL_LOADERS: Loader[] = [
  {
    id: 'loader-1',
    name: 'Loader Alpha',
    pathId: 'path-prod-to-pine-a',
    progress: 0,
    speed: 0.008,
    status: 'moving',
    carryingLogs: 5,
    maxLoad: 10,
    color: '#fbbf24',
    currentSegment: 0,
  },
  {
    id: 'loader-2',
    name: 'Loader Beta',
    pathId: 'path-pine-a-to-sorting-1',
    progress: 0.3,
    speed: 0.007,
    status: 'moving',
    carryingLogs: 8,
    maxLoad: 10,
    color: '#34d399',
    currentSegment: 0,
  },
  {
    id: 'loader-3',
    name: 'Loader Gamma',
    pathId: 'path-sorting-1-to-buffer-1',
    progress: 0.5,
    speed: 0.009,
    status: 'moving',
    carryingLogs: 6,
    maxLoad: 10,
    color: '#60a5fa',
    currentSegment: 0,
  },
  {
    id: 'loader-4',
    name: 'Loader Delta',
    pathId: 'path-buffer-1-to-truck-1',
    progress: 0.1,
    speed: 0.006,
    status: 'moving',
    carryingLogs: 10,
    maxLoad: 10,
    color: '#f472b6',
    currentSegment: 0,
  },
  {
    id: 'loader-5',
    name: 'Loader Epsilon',
    pathId: 'path-prod-to-eucalyptus',
    progress: 0.5,
    speed: 0.008,
    status: 'moving',
    carryingLogs: 7,
    maxLoad: 10,
    color: '#a78bfa',
    currentSegment: 0,
  },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Get capacity color based on fill percentage
 */
export function getCapacityColor(current: number, max: number): string {
  if (max === 0) return '#6b7280';
  const pct = current / max;
  if (pct > 0.9) return '#dc2626'; // Red > 90%
  if (pct >= 0.7) return '#f97316'; // Orange 70-90%
  return '#16a34a'; // Green < 70%
}

/**
 * Get capacity percentage
 */
export function getCapacityPct(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((current / max) * 100);
}

/**
 * Interpolate a point along a polyline at progress t (0-1)
 */
export function interpolateAlongPath(points: LatLng[], t: number): LatLng {
  if (points.length === 0) return [0, 0];
  if (points.length === 1) return points[0];
  if (t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  // Calculate total length
  let totalLen = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dl = Math.sqrt(
      Math.pow(points[i + 1][0] - points[i][0], 2) +
        Math.pow(points[i + 1][1] - points[i][1], 2)
    );
    segLengths.push(dl);
    totalLen += dl;
  }

  const target = t * totalLen;
  let accumulated = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= target) {
      const segT = (target - accumulated) / segLengths[i];
      return [
        points[i][0] + segT * (points[i + 1][0] - points[i][0]),
        points[i][1] + segT * (points[i + 1][1] - points[i][1]),
      ];
    }
    accumulated += segLengths[i];
  }
  return points[points.length - 1];
}

/**
 * Zone type display info
 */
export const ZONE_TYPE_INFO: Record<string, { label: string; icon: string }> = {
  log: { label: 'Log Storage', icon: '🪵' },
  sorting: { label: 'Sorting', icon: '🔀' },
  buffer: { label: 'Buffer', icon: '📦' },
  truck: { label: 'Truck Bay', icon: '🚛' },
  overflow: { label: 'Overflow', icon: '⚠️' },
  production: { label: 'Production', icon: '🏭' },
  stem: { label: 'Stem Zone', icon: '🚫' },
};
