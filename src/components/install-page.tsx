
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

export function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: 'App Installed!',
          description: 'The Droppurity app has been added to your device.',
        });
      }
      setInstallPrompt(null);
    } else if (isIos) {
      toast({
        title: 'Manual Installation Required',
        description: "Tap the 'Share' button, then 'Add to Home Screen'.",
      });
    } else {
       toast({
        title: 'Manual Installation Required',
        description: "Use your browser's menu to 'Install App' or 'Add to Home Screen'.",
      });
    }
  };

  const renderManualInstructions = () => {
    const iosSteps = (
      <>
        <p className="font-semibold text-foreground">To install on iOS:</p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Tap the 'Share' button <Share className="inline-block h-4 w-4" /> in your browser.</li>
          <li>Scroll down and select 'Add to Home Screen'.</li>
          <li>Confirm by tapping 'Add'.</li>
        </ol>
      </>
    );

    const otherSteps = (
      <>
        <p className="font-semibold text-foreground">To install on your device:</p>
        <ol className="list-decimal list-inside space-y-2">
           <li>Open your browser's menu (usually three dots).</li>
           <li>Look for and tap "Install App" or "Add to Home Screen".</li>
        </ol>
      </>
    );

    return (
      <div className="mt-4 text-sm text-muted-foreground space-y-3 text-left bg-muted p-4 rounded-md">
        {isIos ? iosSteps : otherSteps}
      </div>
    );
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Droppurity</h1>
        <p className="text-muted-foreground mb-8">Monitor your water, effortlessly.</p>
        
        <Card>
            <CardHeader>
                <CardTitle>Install the App</CardTitle>
                <CardDescription>
                    For the best experience, install the Droppurity app on your device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInstallClick} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                </Button>
                {renderManualInstructions()}
            </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-12">
            This application is designed to run as an installed Progressive Web App (PWA).
        </p>
      </div>
    </div>
  );
}
