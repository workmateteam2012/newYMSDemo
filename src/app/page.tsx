'use client';

import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues with Leaflet
const TimberYardMap = dynamic(() => import('@/components/TimberYardMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-950 text-white">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">🪵</div>
        <div className="text-xl font-bold text-amber-400">Loading Timber Yard...</div>
        <div className="text-sm text-gray-400 mt-2">Initializing GPS coordinates</div>
      </div>
    </div>
  ),
});

export default function Home() {
  return <TimberYardMap />;
}
