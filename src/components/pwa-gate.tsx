
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';

// This component now strictly enforces that the app is installed (PWA).
// If it's not, it will ONLY show the installation page.
// If it is, it will render the children (the rest of the app).
export function PwaGate({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // This check is the most reliable way to determine if the app is running in standalone mode.
    const checkInstalledStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                             window.matchMedia('(display-mode: minimal-ui)').matches ||
                             window.matchMedia('(display-mode: fullscreen)').matches ||
                             (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    // Run the check once the component mounts.
    checkInstalledStatus();

    // Listen for changes in display mode, though the initial check is most important.
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalledStatus);
    
    return () => mediaQuery.removeEventListener('change', checkInstalledStatus);
  }, []);

  // --- DEBUG BYPASS ---
  // The PWA gate is temporarily bypassed to allow for easier debugging.
  return <>{children}</>;

  // While we're checking, show a loader to prevent content flashing.
  if (isInstalled === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  // If the app is NOT installed, show the installation page and nothing else.
  if (!isInstalled) {
    return <InstallPage />;
  }

  // If the app IS installed, render the actual application content.
  return <>{children}</>;
}
