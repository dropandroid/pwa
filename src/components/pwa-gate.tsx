
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';

export function PwaGate({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);

  useEffect(() => {
    // This effect runs only on the client side
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Check for other potential standalone modes used by different browsers/OS
    const isMinimalUi = window.matchMedia('(display-mode: minimal-ui)').matches;
    const isInstalled = isStandalone || isMinimalUi;
    
    setIsPwa(isInstalled);
  }, []);

  if (isPwa === null) {
    // While we're checking, show a loading state to avoid flashes of content
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  if (isPwa) {
    // If it's a PWA, render the actual application
    return <>{children}</>;
  }

  // If it's not a PWA, show the installation prompt page
  return <InstallPage />;
}
