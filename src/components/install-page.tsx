
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log('beforeinstallprompt event fired.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          toast({
            title: 'Installation Started',
            description: 'The app is being added to your device.',
          });
        } else {
          console.log('User dismissed the install prompt');
        }
        setInstallPrompt(null);
      });
    } else {
      // If no prompt, show manual instructions
      setShowInstructions(true);
    }
  };

  const renderInstructions = () => {
    if (!showInstructions) return null;

    if (isIOS) {
      return (
          <div className="mt-4 text-sm text-muted-foreground space-y-3 text-left bg-muted p-4 rounded-md">
              <p className="font-semibold text-foreground">To install this app on your iPhone/iPad:</p>
              <ol className="list-decimal list-inside space-y-2">
                  <li>Tap the 'Share' button in your browser's toolbar.</li>
                  <li>Scroll down and tap 'Add to Home Screen'.</li>
                  <li>Confirm by tapping 'Add'.</li>
              </ol>
          </div>
      );
    }

    return (
        <div className="mt-4 text-sm text-muted-foreground space-y-3 text-left bg-muted p-4 rounded-md">
            <p className="font-semibold text-foreground">To install this app on your device:</p>
            <ol className="list-decimal list-inside space-y-2">
                <li>Look for an install icon (often a screen with a down arrow) in your browser's address bar.</li>
                <li>Alternatively, check your browser's menu (usually three dots) for an "Install App" or "Add to Home Screen" option.</li>
            </ol>
            <p className="pt-2">If you don't see these options, your browser may not support PWA installation.</p>
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
                    For the best experience, please install the Droppurity app to your device.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleInstallClick} size="lg" className="w-full">
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                </Button>

                {renderInstructions()}
            </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-12">
            This application is designed to run as an installed Progressive Web App (PWA).
        </p>
      </div>
    </div>
  );
}
