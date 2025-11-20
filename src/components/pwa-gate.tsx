
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { InstallPage } from './install-page';
import { Loader2 } from 'lucide-react';
import { NotificationGate } from './notification-gate';

export function PwaGate({ children }: { children: ReactNode }) {
  const [isPwa, setIsPwa] = useState<boolean | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    // This check determines if the app is running in standalone mode (i.e., installed).
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: minimal-ui)').matches;
    setIsPwa(isInstalled);

    if (isInstalled) {
       if ('Notification' in window) {
           setPermissionStatus(Notification.permission);
       } else {
           // If notifications aren't supported, treat as granted to not block the user.
           setPermissionStatus('granted');
       }
    }
  }, []);
  
  const handlePermissionUpdate = (status: NotificationPermission) => {
    setPermissionStatus(status);
  };


  // While checking, show a loading state to prevent content flashing.
  if (isPwa === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  // Condition 1: App is not installed, show the installation page.
  if (isPwa === false) {
    return <InstallPage />;
  }

  // Condition 2: App is installed, but notification permission is not granted yet.
  if (isPwa && permissionStatus !== 'granted') {
    return <NotificationGate onPermissionUpdate={handlePermissionUpdate} />;
  }

  // Condition 3: App is installed and permission is granted.
  return <>{children}</>;
}
