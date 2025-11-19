
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, Router, Info, Plus, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';

// --- Monitoring Mode Components ---

interface Device {
  id: string;
  ip: string;
}

const LOCAL_STORAGE_KEY = 'monitoringDevices';

const DeviceCard = ({ device, onRemove }: { device: Device, onRemove: (id: string) => void }) => {
  const handleViewExistingDevice = (ipAddress: string) => {
    // In a PWA, we'd likely open this in a new tab or an iframe modal.
    // For simplicity, we'll just open in a new tab.
    window.open(`http://${ipAddress}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="flex flex-col justify-between relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
        onClick={() => onRemove(device.id)}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-base truncate">Device</CardTitle>
        <CardDescription>IP: {device.ip}</CardDescription>
      </CardHeader>
      <CardContent>
         <Button 
            className="w-full" 
            onClick={() => handleViewExistingDevice(device.ip)}
          >
            View Device
          </Button>
      </CardContent>
    </Card>
  );
};

const MonitoringMode = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [ipInput, setIpInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedDevicesRaw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDevicesRaw) {
        const savedDevices = JSON.parse(savedDevicesRaw);
        if (Array.isArray(savedDevices)) {
          setDevices(savedDevices);
        }
      }
    } catch (error) {
      console.error("Failed to load devices from localStorage", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load saved devices.',
      });
    }
  }, [toast]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(devices));
    } catch (error) {
      console.error("Failed to save devices to localStorage", error);
    }
  }, [devices]);

  const handleAddDevice = () => {
    if (!ipInput.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
        toast({
            variant: 'destructive',
            title: 'Invalid IP Address',
            description: 'Please enter a valid IP address (e.g., 192.168.1.100).',
        });
        return;
    }
    if (devices.some(d => d.ip === ipInput)) {
        toast({
            variant: 'destructive',
            title: 'Device Exists',
            description: 'This IP address has already been added.',
        });
        return;
    }
    const newDevice = { id: ipInput, ip: ipInput };
    setDevices(prev => [...prev, newDevice]);
    setIpInput('');
  };

  const handleRemoveDevice = (id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  };


  return (
    <div>
        <div className="flex gap-2 mb-4">
            <Input 
                type="text" 
                placeholder="Enter device IP address"
                value={ipInput}
                onChange={e => setIpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddDevice()}
            />
            <Button onClick={handleAddDevice} size="icon">
                <Plus />
            </Button>
        </div>
      {devices.length === 0 ? (
         <Card className="text-center p-6 border-dashed">
            <Info className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No Online Devices</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a device using its local IP address to monitor it.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map(device => (
            <DeviceCard 
                key={device.id} 
                device={device}
                onRemove={handleRemoveDevice}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Configuration Mode Component ---

const ConfigurationMode = () => {
    const handleStartNewDeviceSetup = () => {
      // In a PWA, this would redirect to the device's hotspot IP, which is typically static.
      // The user must be connected to the device's Wi-Fi hotspot first.
      window.open('http://192.168.4.1', '_blank', 'noopener,noreferrer');
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Hotspot Mode Setup</CardTitle>
                <CardDescription>Provision a new device by connecting it to your Wi-Fi network.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="bg-primary/10 p-4 rounded-lg space-y-3 mb-6">
                    <h3 className="font-semibold text-primary">Instructions</h3>
                    <ol className="text-sm text-primary/90 list-decimal list-inside space-y-2">
                        <li>Power on your new AquaTrack device.</li>
                        <li>Connect your phone's Wi-Fi to the device's hotspot (e.g., 'droppurity-xxxx').</li>
                        <li>Tap the button below to open the device configuration page.</li>
                        <li>Follow the on-screen steps to connect the device to your home Wi-Fi.</li>
                    </ol>
                </div>
                
                 <Button onClick={handleStartNewDeviceSetup} className="w-full" size="lg">
                    <Router className="mr-2" />
                    Start Device Setup
                </Button>

            </CardContent>
        </Card>
    )
}


export const LiveDeviceTab: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Live Device Management</h2>
        <Tabs defaultValue="wifi-mode" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wifi-mode"><Wifi className="mr-2"/> Online Devices</TabsTrigger>
                <TabsTrigger value="hotspot-mode"><Router className="mr-2"/> New Device Setup</TabsTrigger>
            </TabsList>
            <TabsContent value="wifi-mode">
                <MonitoringMode />
            </TabsContent>
            <TabsContent value="hotspot-mode">
                <ConfigurationMode />
            </TabsContent>
        </Tabs>
    </div>
  );
};
