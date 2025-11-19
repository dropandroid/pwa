
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Loader2, CheckCircle, Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useToast } from '@/hooks/use-toast';

type InstallState = 'idle' | 'installing' | 'completed' | 'declined';

export function InstallPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installState, setInstallState] = useState<InstallState>('idle');
  const [isIos, setIsIos] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      console.log("beforeinstallprompt event captured.");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIos(isIOSDevice);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt.');
        setInstallState('installing');
        // Give the browser a moment to start the installation process
        setTimeout(() => setInstallState('completed'), 15000);
      } else {
        console.log('User dismissed the install prompt.');
        setInstallState('declined');
        toast({
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
  
  const renderIdleContent = () => (
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
  );

  const renderInstallingContent = () => (
    <Card className="text-center p-8">
        <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Installing App...</h2>
        <p className="text-muted-foreground mt-2">Please follow the prompts from your browser to complete the installation.</p>
    </Card>
  );

  const renderCompletedContent = () => (
    <Card className="text-center p-8 bg-green-500/10 border-green-500">
        <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
        <h2 className="mt-4 text-xl font-semibold text-green-800">Installation Complete!</h2>
        <p className="text-green-700/90 mt-2">
            The app has been added to your device. Look for the Droppurity icon on your home screen or in your app list to open it.
        </p>
    </Card>
  );

  const renderContent = () => {
    switch (installState) {
        case 'installing':
            return renderInstallingContent();
        case 'completed':
            return renderCompletedContent();
        case 'idle':
        case 'declined':
        default:
            return renderIdleContent();
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md text-center">
         <div className="flex justify-center items-center mb-6">
            <Smartphone className="w-16 h-16 text-primary" />
         </div>
        <h1 className="text-4xl font-bold text-primary mb-2">Droppurity</h1>
        <p className="text-muted-foreground mb-8">Monitor your water, effortlessly.</p>
        
        {renderContent()}

        <p className="text-xs text-muted-foreground mt-12">
            This application is a Progressive Web App (PWA), which runs like a native app.
        </p>
      </div>
    </div>
  );
}
