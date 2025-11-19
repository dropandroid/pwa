
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';

export function PwaGate({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);

  useEffect(() => {
    // This check determines if the app is running in standalone mode (i.e., installed).
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
    setIsPwa(isInstalled);
  }, []);

  // Condition 1: App is installed and running in PWA mode.
  if (isPwa) {
    return <>{children}</>;
  }

  // Condition 2: App is not installed, show the installation page.
  if (isPwa === false) {
    return <InstallPage />;
  }
  
  // While checking, show a loading state to prevent content flashing.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-4">Loading...</p>
    </div>
  );
}
