'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, Plus, X, Globe, Expand, Router } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// --- Types ---
interface Device {
  id: string;
  ip: string;
}

const LOCAL_STORAGE_KEY = 'monitoringDevices';

// --- Components ---

const DeviceCard = ({ device, onRemove, onSelect }: { device: Device, onRemove: (e: React.MouseEvent, id: string) => void, onSelect: (device: Device) => void }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelect(device)}>
      <CardContent className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
                <Router className="w-6 h-6 text-primary"/>
            </div>
            <div>
                <p className="font-semibold text-foreground">Device IP</p>
                <p className="text-sm text-muted-foreground font-mono">{device.ip}</p>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-9 w-9">
                <Expand className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={(e) => onRemove(e, device.id)}>
                <X className="h-5 w-5"/>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};


export const LiveDeviceTab: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [ipInput, setIpInput] = useState('');
  const { toast } = useToast();
  const router = useRouter();

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

  const handleRemoveDevice = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDevices(prev => prev.filter(d => d.id !== id));
  };
  
  const handleSelectDevice = (device: Device) => {
      router.push(`/live-device/${device.ip}`);
  };


  return (
    <div className="p-4 space-y-6">
        <h2 className="text-xl font-bold text-foreground">Live Device Broadcast</h2>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Add New Device</CardTitle>
                <CardDescription>Enter the local IP address of a device to monitor its broadcast.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Input 
                        type="text" 
                        placeholder="e.g., 192.168.1.100"
                        value={ipInput}
                        onChange={e => setIpInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddDevice()}
                    />
                    <Button onClick={handleAddDevice} className="shrink-0">
                        <Plus className="mr-2 h-4 w-4" /> Add
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="space-y-4">
             <h3 className="text-lg font-semibold text-foreground">Monitored Devices</h3>
            {devices.length === 0 ? (
            <Card className="text-center p-8 border-dashed">
                <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg">No Devices Found</h3>
                <p className="text-sm text-muted-foreground mt-1">Add a device by its local IP address to begin monitoring.</p>
            </Card>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                {devices.map(device => (
                    <DeviceCard 
                        key={device.id} 
                        device={device}
                        onRemove={handleRemoveDevice}
                        onSelect={handleSelectDevice}
                    />
                ))}
                </div>
            )}
        </div>
    </div>
  );
};
