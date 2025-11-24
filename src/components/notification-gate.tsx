
'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { getMessaging, getToken } from 'firebase/messaging';
import { app } from '@/lib/firebase';

type NotificationPermissionStatus = NotificationPermission | 'unsupported' | 'loading';

interface NotificationGateProps {
  children: ReactNode;
}

export function NotificationGate({ children }: NotificationGateProps) {
  const [permission, setPermission] = useState<NotificationPermissionStatus>('loading');

  const requestPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported in this browser.');
      setPermission('unsupported');
      return;
    }

    setPermission('loading');
    try {
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        console.log('Notification permission granted.');
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (currentToken) {
          // In a real app, you'd save this token to the server against a user ID *after* login.
          // For now, we just confirm it's been received.
          console.log('FCM Token retrieved:', currentToken);
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
      console.error('An error occurred while requesting notification permission:', error);
      setPermission('denied'); // Assume denied on error
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  if (permission === 'granted') {
    return <>{children}</>;
  }
  
  const renderContent = () => {
    if (permission === 'denied' || permission === 'unsupported') {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <BellOff className="w-12 h-12 text-destructive"/>
            </div>
            <CardTitle className="text-center text-destructive">Notifications Required</CardTitle>
            <CardDescription className="text-center">
              {permission === 'unsupported' 
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
          <Button onClick={requestPermission} size="lg" className="w-full" disabled={permission === 'loading'}>
            {permission === 'loading' ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Bell className="mr-2 h-5 w-5" /> }
            {permission === 'loading' ? 'Waiting for permission...' : 'Enable Notifications'}
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
