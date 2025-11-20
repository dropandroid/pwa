
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, Plus, X, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// --- Types ---
interface Device {
  id: string;
  ip: string;
}

const LOCAL_STORAGE_KEY = 'monitoringDevices';

// --- Components ---

const DeviceFrame = ({ device, onRemove }: { device: Device, onRemove: (id: string) => void }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-base">Device: {device.ip}</CardTitle>
                <CardDescription>Live device broadcast</CardDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(device.id)}><X className="h-4 w-4"/></Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="aspect-video w-full bg-muted rounded-md overflow-hidden border">
           <iframe
              src={`http://${device.ip}`}
              className="w-full h-full border-0"
              title={`Live feed for ${device.ip}`}
              sandbox="allow-scripts allow-same-origin" // Security sandbox
            ></iframe>
        </div>
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
    }
  }, []);

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
            description: 'This IP address is already being monitored.',
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
            <Button onClick={handleAddDevice}>
                <Plus className="mr-2 h-4 w-4" /> Add
            </Button>
        </div>
      {devices.length === 0 ? (
         <Card className="text-center p-6 border-dashed">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No Devices to Monitor</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a device by its local IP address to see its broadcasted page.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {devices.map(device => (
            <DeviceFrame 
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


export const LiveDeviceTab: React.FC = () => {
  return (
    <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold text-foreground">Live Device Broadcast</h2>
        <MonitoringMode />
    </div>
  );
};
