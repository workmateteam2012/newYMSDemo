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

## Quick Start Guide

### To add a new page:

Create a file at `src/app/[route]/page.tsx`:
```tsx
export default function NewPage() {
  return <div>New page content</div>;
}
```

### To add components:

Create `src/components/` directory and add components:
```tsx
// src/components/ui/Button.tsx
export function Button({ children }: { children: React.ReactNode }) {
  return <button className="px-4 py-2 bg-blue-600 text-white rounded">{children}</button>;
}
```

### To add a database:

Follow `.kilocode/recipes/add-database.md`

### To add API routes:

Create `src/app/api/[route]/route.ts`:
```tsx
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Hello" });
}
```

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Pending Improvements

- [ ] Add more recipes (auth, email, etc.)
- [ ] Add example components
- [ ] Add testing setup recipe

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
