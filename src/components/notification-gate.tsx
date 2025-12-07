
'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '@/hooks/use-auth';

interface NotificationGateProps {
  children: ReactNode;
}

export function NotificationGate({ children }: NotificationGateProps) {
  const { notificationPermission, requestNotificationPermission } = useAuth();

  if (notificationPermission === 'granted') {
    return <>{children}</>;
  }
  
  const renderContent = () => {
    if (notificationPermission === 'loading') {
       return (
         <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
         </div>
       )
    }

    if (notificationPermission === 'denied' || notificationPermission === 'unsupported') {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <BellOff className="w-12 h-12 text-destructive"/>
            </div>
            <CardTitle className="text-center text-destructive">Notifications Required</CardTitle>
            <CardDescription className="text-center">
              {notificationPermission === 'unsupported' 
                ? "This browser does not support push notifications, which are required for this app."
                : "To use the app, you must enable push notifications in your browser or device settings."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
             <p className="text-sm text-muted-foreground mb-4">After enabling permissions, please reload the app.</p>
             <Button onClick={() => window.location.reload()} variant="destructive" className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Check Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
       <Card>
        <CardHeader>
          <div className="flex justify-center mb-4">
              <Bell className="w-12 h-12 text-primary"/>
          </div>
          <CardTitle className="text-center">Enable Notifications</CardTitle>
          <CardDescription className="text-center">
            To get important alerts about your water purifier, please enable push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={requestNotificationPermission} size="lg" className="w-full" disabled={notificationPermission === 'loading'}>
            <Bell className="mr-2 h-5 w-5" />
            Enable Notifications
          </Button>
           <p className="text-xs text-muted-foreground mt-4 text-center">
              We need this to send you critical alerts about plan expiry, service reminders, and water quality issues.
           </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">One Last Step</h1>
        <p className="text-muted-foreground mb-8">Let's get you connected.</p>
        
        {renderContent()}

      </div>
    </div>
  );
}
