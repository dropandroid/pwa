
'use client';

import { Droplets } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary">
      <div className="text-center text-primary-foreground">
        <Droplets className="w-16 h-16 mx-auto mb-4 animate-pulse" />
        <h1 className="text-4xl font-bold tracking-wider">
          Droppurity
        </h1>
        <p className="text-lg opacity-80">Loading your dashboard...</p>
      </div>
    </div>
  );
}
