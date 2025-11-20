
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, Plus, X, Loader2, AlertTriangle, Power, Clock, Calendar, Network, Server, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// --- Types ---
interface Device {
  id: string;
  ip: string;
}

interface LiveStatus {
    firmwareVersion: string;
    deviceMode: string;
    serialNumber: string;
    provisionedId: string;
    deviceTime: string;
    lastSuccessfulSync: string;
    nextScheduledSync: string;
    lastSyncError: string;
    pendingErrorCode: string;
    totalMinutesUsed: number;
    maxMinutes: number;
    planEndDate: string;
    remainingDays: number;
    isPlanExpired: boolean;
    triggerPinStatus: string;
    relayStatus: string;
    savedSSID: string;
    wifiStatus: string;
    wifiIP: string;
}

const LOCAL_STORAGE_KEY = 'monitoringDevices';
const LITERS_PER_HOUR = 12;

// --- Components ---

const StatusItem = ({ icon, label, value, valueClass }: { icon: React.ReactNode, label: string, value: string | number, valueClass?: string }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center text-muted-foreground">
            {icon}
            <span className="ml-2">{label}</span>
        </div>
        <span className={cn("font-semibold text-right", valueClass)}>{value}</span>
    </div>
);


const LiveDeviceCard = ({ device, onRemove }: { device: Device, onRemove: (id: string) => void }) => {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    // Don't set loading to true on auto-refresh, only on manual refresh
    try {
      // We call our OWN backend proxy, not the device directly.
      const response = await fetch(`/api/live-status?ip=${device.ip}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (e: any) {
      console.error(`Failed to fetch status for ${device.ip} via proxy`, e);
      setError(e.message || 'Failed to connect. Check IP and network.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchData();
  }

  useEffect(() => {
    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [device.ip]);

  const usageLiters = useMemo(() => {
      if (!status) return 0;
      return (status.totalMinutesUsed / 60) * LITERS_PER_HOUR;
  }, [status]);
  
  const maxLiters = useMemo(() => {
      if (!status) return 0;
      return (status.maxMinutes / 60) * LITERS_PER_HOUR;
  }, [status]);
  
  const usagePercentage = useMemo(() => {
      if (!status || status.maxMinutes === 0) return 0;
      return (status.totalMinutesUsed / status.maxMinutes) * 100;
  }, [status]);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Connecting to {device.ip}...</CardTitle>
                 <CardDescription>Fetching live data from device...</CardDescription>
            </CardHeader>
            <CardContent className="h-48"></CardContent>
        </Card>
    )
  }

  if (error || !status) {
    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center"><AlertTriangle className="mr-2 h-4 w-4"/> Connection Error</CardTitle>
                <CardDescription className="text-destructive/80">IP: {device.ip}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-center text-destructive">{error}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="destructive" className="w-full" size="sm" onClick={handleManualRefresh}>Retry</Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => onRemove(device.id)}><X className="h-4 w-4"/></Button>
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="flex flex-col">
       <CardHeader>
            <div className="flex justify-between items-start">
                 <div>
                    <CardTitle className="text-base">
                        Live Status: <span className="text-primary">{status.provisionedId}</span>
                    </CardTitle>
                    <CardDescription>IP: {status.wifiIP} | SN: {status.serialNumber}</CardDescription>
                 </div>
                 <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleManualRefresh}><RefreshCw className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemove(device.id)}><X className="h-4 w-4"/></Button>
                 </div>
            </div>
             <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant={status.wifiStatus.toLowerCase() === 'connected' ? 'default' : 'destructive'} className={cn(status.wifiStatus.toLowerCase() === 'connected' && "bg-green-600")}>
                    <Wifi className="mr-1.5 h-3 w-3" /> {status.wifiStatus} to "{status.savedSSID}"
                </Badge>
                <Badge variant={status.relayStatus.toLowerCase() === 'on' ? 'default' : 'secondary'} className={cn(status.relayStatus.toLowerCase() === 'on' && "bg-blue-600")}>
                     <Power className="mr-1.5 h-3 w-3" /> Relay: {status.relayStatus}
                </Badge>
             </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Plan Usage (Liters)</span>
                <span>{usageLiters.toFixed(1)}L / {maxLiters.toFixed(0)}L ({usagePercentage.toFixed(1)}%)</span>
            </div>
            <Progress value={usagePercentage} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 border-t pt-4">
            <StatusItem icon={<Calendar className="text-red-500" />} label="Plan Ends" value={status.planEndDate} />
            <StatusItem icon={<Calendar className="text-green-500" />} label="Days Left" value={status.remainingDays} />
            <StatusItem icon={<Clock/>} label="Device Time" value={status.deviceTime} />
            <StatusItem icon={<RefreshCw/>} label="Last Sync" value={status.lastSuccessfulSync} />
            <StatusItem icon={<Server/>} label="Firmware" value={status.firmwareVersion} />
            <StatusItem icon={<CheckCircle className={cn(status.isPlanExpired ? 'text-destructive' : 'text-green-500')}/>} label="Plan Active" value={status.isPlanExpired ? 'No' : 'Yes'} />
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
            <Wifi className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No Devices to Monitor</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a device by its local IP address to see its live status.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {devices.map(device => (
            <LiveDeviceCard 
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
        <h2 className="text-xl font-bold text-foreground">Live Device Monitoring</h2>
        <MonitoringMode />
    </div>
  );
};
