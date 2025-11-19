'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

export function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIOSDevice);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalling) return;

    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalling(true);
        toast({
          title: 'Installation Started',
          description: 'Completing setup. The app will reload shortly.',
        });
        // Wait 5 seconds to give the browser time to finish installation
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      } else {
        toast({
          variant: "destructive",
          title: 'Installation Cancelled',
          description: 'You can install the app anytime from this page.',
        });
      }
    } else {
       toast({
        title: 'Manual Installation Required',
        description: 'Please follow the browser instructions to add this app to your home screen.',
      });
    }
  };

  const renderManualInstructions = () => {
    const iosSteps = (
      <>
        <p className="font-semibold text-foreground">To install on your Apple device:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Tap the 'Share' button <Share className="inline-block h-4 w-4" /> in your browser's toolbar.</li>
          <li>Scroll down and select 'Add to Home Screen'.</li>
          <li>Confirm by tapping 'Add' in the top right.</li>
        </ol>
      </>
    );

    const otherSteps = (
      <>
        <p className="font-semibold text-foreground">To install on your device:</p>
        <ol className="list-decimal list-inside space-y-2">
           <li>Open your browser's menu (usually three dots or an icon).</li>
           <li>Look for and tap "Install App" or "Add to Home Screen".</li>
        </ol>
      </>
    );

    return (
      <div className="mt-4 text-sm text-muted-foreground space-y-3 text-left bg-muted p-4 rounded-md border">
        {isIos ? iosSteps : otherSteps}
      </div>
    );
  };


  if (isInstalling) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <h2 className="mt-6 text-xl font-semibold">Completing installation...</h2>
            <p className="text-muted-foreground mt-2">The application will start shortly.</p>
        </div>
     )
  }


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Droppurity</h1>
        <p className="text-muted-foreground mb-8">Monitor your water, effortlessly.</p>
        
        <Card>
            <CardHeader>
                <CardTitle>Install the App</CardTitle>
                <CardDescription>
                    For the best experience, install the Droppurity app on your device for offline access and notifications.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInstallClick} size="lg" className="w-full" disabled={!installPrompt && !isIos}>
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                </Button>
                {(!installPrompt || isIos) && renderManualInstructions()}
            </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-12">
            This application is a Progressive Web App (PWA), which runs like a native app.
        </p>
      </div>
    </div>
  );
}
