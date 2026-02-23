# Active Context: Timber Yard Management System

## Current State

**Application Status**: ✅ GPS-Based Timber Yard Management System - Fully Implemented

A full-featured timber yard operations dashboard built on GPS coordinates using Leaflet.js for map rendering. The yard is located in Rotorua, New Zealand.

## Recently Completed

- [x] Base Next.js 16 setup with App Router
- [x] TypeScript configuration with strict mode
- [x] Tailwind CSS 4 integration
- [x] ESLint configuration
- [x] Memory bank documentation
- [x] Recipe system for common features
- [x] GPS-based yard boundary polygon (13 vertices)
- [x] Locked zones: Stem Zone + Production House (no paths through)
- [x] 12 operational zones: 4 log zones, 2 sorting, 2 buffer, 3 truck bays, 2 overflow
- [x] 16 one-way loader paths routing around zones
- [x] 5 animated loaders with real-time GPS position tracking
- [x] Live inventory simulation with capacity color coding
- [x] Satellite tile layer (Esri World Imagery)
- [x] Interactive zone detail panel with manual stock adjustment
- [x] Critical zone alerts bar
- [x] Path/loader visibility toggles
- [x] **FIX: Relocated all 12 operational zones inside yard boundary** (south area, lat -38.4115 to -38.4137)
- [x] **FIX: Redesigned 16 one-way paths** to route between zone edges through corridors, not through zones or locked areas
- [x] **FIX: Updated loader starting positions** to be on valid paths
- [x] **ADDED: Wagner Big Red loader** - transfers stems from Stem Zone to Production House
  - Added 4 stemzone-specific paths (entry, traverse, to production, return)
  - Only Wagner can use stemzone paths via `allowedLoaderIds` restriction
  - Larger marker size, higher z-index for visibility
  - Path sequence cycling for continuous stem transfer operations
- [x] **UPDATED: Locked zones now display as normal** - no special styling (dashed borders, gray fill)
- [x] Removed "Locked Zone" from legend
- [x] **FIX: Stem zone now shows capacity color** - changed icon from 🚫 to 🪵, set maxCapacity to 50, currentStock to 35

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/page.tsx` | Home page (dynamic import of map) | ✅ Ready |
| `src/app/layout.tsx` | Root layout + Leaflet CSS | ✅ Ready |
| `src/app/globals.css` | Global styles + Leaflet overrides | ✅ Ready |
| `src/components/TimberYardMap.tsx` | Main map component | ✅ Ready |
| `src/lib/yardData.ts` | GPS data, zones, paths, loaders | ✅ Ready |
| `.kilocode/` | AI context & recipes | ✅ Ready |

## Key Dependencies Added

- `leaflet@1.9.4` - GPS map rendering
- `@types/leaflet@1.9.21` - TypeScript types

## Wagner Loader Details

The Wagner Big Red loader operates on a 4-path sequence:
1. `path-wagner-stem-entry` - Enter stem zone from north-west
2. `path-wagner-stem-traverse` - Traverse through stem zone
3. `path-wagner-stem-to-production` - Exit to production house (loads)
4. `path-wagner-production-to-stem` - Return to stem zone (unloads)

Path access is restricted via `allowedLoaderIds: ['wagner-1']` - regular loaders cannot use these paths.
