
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';

export function PwaGate({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("PWA Gate: beforeinstallprompt event captured!");
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
    setIsPwa(isInstalled);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Condition 1: App is installed and running in PWA mode.
  if (isPwa === true) {
    return <>{children}</>;
  }

  // Condition 2: App is not installed, show the installation page.
  if (isPwa === false) {
    return <InstallPage installPrompt={installPrompt} />;
  }
  
  // While checking, show a loading state to prevent content flashing.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground mt-4">Loading...</p>
    </div>
  );
}
