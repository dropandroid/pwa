
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';

export function PwaGate({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);

  useEffect(() => {
    // This effect runs only on the client side
    // 'standalone' is the standard display mode for installed PWAs.
    // 'minimal-ui' is also used by some browsers for installed web apps.
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // Forcing a true condition for local testing if needed
    // const isInstalled = true;
    
    setIsPwa(isInstalled);
  }, []);

  // Condition 1: Check for app install
  if (isPwa === true) {
    // If installed, redirect to the app automatically by rendering the children.
    return <>{children}</>;
  }

  // Condition 2: App not detected
  if (isPwa === false) {
    // If not installed, always trigger the "Install Now" page.
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
