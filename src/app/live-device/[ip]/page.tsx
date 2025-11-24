'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, WifiOff, ArrowLeft, RefreshCw, X } from 'lucide-react';

const LiveFeedPage = () => {
  const params = useParams();
  const router = useRouter();
  const ip = typeof params.ip === 'string' ? params.ip : '';

  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'failed'>('connecting');
  const [key, setKey] = useState(Date.now()); // Key to force iframe reload

  useEffect(() => {
    if (!ip) return;

    setConnectionState('connecting');
    const timer = setTimeout(() => {
        // If it's still connecting after 10 seconds, assume failure
        if (connectionState === 'connecting') {
            setConnectionState('failed');
        }
    }, 10000); // 10-second timeout

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ip, key]); // Rerun on ip change or manual retry

  const handleRetry = () => {
    setKey(Date.now()); // Change key to force re-render and re-run useEffect
  };
  
  const renderContent = () => {
    switch (connectionState) {
      case 'connecting':
        return (
          <div className="flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-foreground">Establishing Connection...</h2>
            <p className="text-muted-foreground mt-2">
              Attempting to connect to your device at <span className="font-mono text-primary">{ip}</span>.
            </p>
          </div>
        );
      case 'failed':
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
               <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
                 <WifiOff className="w-10 h-10 text-destructive" />
               </div>
              <CardTitle className="text-destructive mt-4">Connection Failed</CardTitle>
              <CardDescription>
                Could not establish a connection to the device at <span className="font-mono">{ip}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p className='font-semibold text-center'>Please ensure the following:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Your phone and the Drop Purity device are on the <span className='font-semibold'>same Wi-Fi network</span>.</li>
                <li>The IP address <span className="font-mono">{ip}</span> is correct.</li>
                <li>The Drop Purity device is powered on and connected to the network.</li>
              </ul>
              <div className="flex gap-4 pt-4">
                  <Button variant="outline" className="w-full" onClick={() => router.back()}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Go Back
                  </Button>
                  <Button className="w-full" onClick={handleRetry}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry
                  </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'connected':
        return (
            <iframe
                src={`http://${ip}`}
                className="w-full h-full border-0"
                title={`Live feed for ${ip}`}
                sandbox="allow-scripts allow-same-origin allow-forms"
                onLoad={() => setConnectionState('connected')}
                onError={() => setConnectionState('failed')}
            />
        );
    }
  };
  
  if (!ip) {
      return (
           <div className="flex items-center justify-center h-full">
              <p>No device IP provided.</p>
            </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <header className="p-4 border-b flex justify-between items-center shrink-0">
            <h1 className="text-lg font-bold text-foreground">Live Feed: {ip}</h1>
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <X className="h-5 w-5"/>
                <span className="sr-only">Close</span>
            </Button>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 bg-muted/40">
           {renderContent()}
           {/* Hidden iframe to test connection */}
           {connectionState === 'connecting' && (
                <iframe
                    src={`http://${ip}`}
                    className="w-0 h-0 border-0 absolute"
                    title={`Connection test for ${ip}`}
                    onLoad={() => setConnectionState('connected')}
                    onError={() => setConnectionState('failed')}
                    key={key}
                />
           )}
        </main>
    </div>
  );
};

export default LiveFeedPage;
