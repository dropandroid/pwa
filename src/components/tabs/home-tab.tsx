
"use client";

import type { FC } from 'react';
import {
  Calendar,
  Droplets,
  Phone,
  Wrench,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Notifications } from '@/components/notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRoData } from '@/hooks/use-ro-data';
import { calculateDaysRemaining, getDaysElapsed, getTotalPlanDays } from '@/lib/helpers';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type HomeTabProps = ReturnType<typeof useRoData>;

export const HomeTab: FC<HomeTabProps> = (props) => {
  const { roDevice, lastUpdated, handleRefresh, isLoading, notifications } = props;
  const { customerData } = useAuth();
  
  const daysRemaining = calculateDaysRemaining(roDevice.endDate);
  const daysElapsed = getDaysElapsed(roDevice.startDate);
  const totalPlanDays = getTotalPlanDays(roDevice.startDate, roDevice.endDate);
  const planProgressPercentage = totalPlanDays > 0 ? (daysElapsed / totalPlanDays) * 100 : 0;
  
  const usagePercentage = roDevice.totalLimit > 0 ? (roDevice.totalLiters / roDevice.totalLimit) * 100 : 0;
  
  const { toast } = useToast();

  const getQualityColor = (value: number, thresholds: [number, number], reverse: boolean = false) => {
    if (reverse) {
      if (value <= thresholds[0]) return 'text-green-600';
      if (value <= thresholds[1]) return 'text-accent';
      return 'text-destructive';
    }
    if (value >= thresholds[1]) return 'text-green-600';
    if (value >= thresholds[0]) return 'text-accent';
    return 'text-destructive';
  };
  
  const getQualityProgressColor = (value: number) => {
     if (value >= 98) return 'bg-green-500';
     if (value >= 95) return 'bg-accent';
     return 'bg-destructive';
  }
  
  const getTdsProgressColor = (value: number) => {
      if (value <= 50) return 'bg-green-500';
      if (value <= 100) return 'bg-accent';
      return 'bg-orange-500';
  }

  const getFilterLifeProgressColor = (value: number) => {
      if (value > 50) return 'bg-green-500';
      if (value > 20) return 'bg-accent';
      return 'bg-destructive';
  }


  return (
    <div className="p-4 space-y-4">
      <Card className={cn(
          "text-primary-foreground",
          roDevice.status?.toLowerCase() === 'expired' 
            ? 'bg-gradient-to-br from-destructive to-red-800' 
            : 'bg-gradient-to-br from-primary to-green-600'
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1">{roDevice.deviceName}</h2>
              <p className="opacity-80 text-sm">Serial: {roDevice.serialNumber}</p>
            </div>
            <div className="text-right text-xs">
              <p className="opacity-80">Total Filtered</p>
              <p className="text-lg font-bold">{roDevice.totalLiters.toFixed(1)}L</p>
            </div>
          </div>
           <div className={`inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium ${
            roDevice.status?.toLowerCase() === 'active' ? 'bg-green-100/20 text-green-50' : 'bg-red-100/20 text-red-50'
          }`}>
             {roDevice.status?.toLowerCase() === 'active' ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <AlertTriangle className="w-3 h-3 mr-1.5" />}
            {roDevice.status?.toUpperCase()}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Last synced: {lastUpdated.toLocaleString()}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {notifications.length > 0 && <Notifications notifications={notifications} />}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Left</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${daysRemaining <= 30 ? 'text-destructive' : 'text-green-600'}`}>
              {daysRemaining}
            </div>
            <p className="text-xs text-muted-foreground">Until plan expires</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roDevice.totalLiters.toFixed(1)}L</div>
            <p className="text-xs text-muted-foreground">of {roDevice.totalLimit.toFixed(0)}L limit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Usage Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Used</span>
            <span>{roDevice.totalLiters.toFixed(1)}L / {roDevice.totalLimit.toFixed(0)}L ({Math.round(usagePercentage)}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  usagePercentage > 90 ? 'bg-destructive' : 
                  usagePercentage > 70 ? 'bg-accent' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              ></div>
            </div>
          <p className="text-xs text-muted-foreground mt-2">
            {usagePercentage > 90 ? 'High usage - nearing plan limit' : 
             usagePercentage > 70 ? 'Moderate usage - within normal range' : 'Normal usage - well within limits'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{new Date(roDevice.startDate).toLocaleDateString()}</span>
            <span>{new Date(roDevice.endDate).toLocaleDateString()}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full bg-primary`}
              style={{ width: `${planProgressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-2">
            {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Plan has expired'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Water Quality Status</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center">
             <div>
              <p className="text-sm text-muted-foreground">Tap TDS</p>
              <p className={`text-lg font-bold ${getQualityColor(parseInt(customerData?.tdsBefore || '250', 10), [300, 200], true)}`}>
                {parseInt(customerData?.tdsBefore || '0', 10)} ppm
              </p>
               <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full ${getTdsProgressColor(parseInt(customerData?.tdsBefore || '250', 10))}`}
                  style={{ width: `${Math.min((parseInt(customerData?.tdsBefore || '250', 10) / 500) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purified</p>
              <p className={`text-lg font-bold ${getQualityColor(roDevice.tdsLevel, [50, 60], true)}`}>{roDevice.tdsLevel} ppm</p>
              <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full ${getTdsProgressColor(roDevice.tdsLevel)}`}
                  style={{ width: `${Math.min((roDevice.tdsLevel / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purity</p>
              <p className={`text-lg font-bold ${getQualityColor(roDevice.purityLevel, [95, 98])}`}>{roDevice.purityLevel}%</p>
               <div className="w-full bg-muted rounded-full h-2 mt-1">
                <div 
                  className={`h-2 rounded-full ${getQualityProgressColor(roDevice.purityLevel)}`}
                  style={{ width: `${roDevice.purityLevel}%` }}
                ></div>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Plan Information</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan Name:</span><span className="font-medium">{customerData?.currentPlanName || '-'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Start Date:</span><span className="font-medium">{new Date(roDevice.startDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">End Date:</span><span className="font-medium">{new Date(roDevice.endDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Device Status (live from device):</span>
            <div className="text-right">
                <span className="font-medium">{customerData?.deviceStatus ?? '-'}</span>
                {customerData?.lastEspSync && (
                    <p className="text-xs text-muted-foreground">as of {new Date(customerData.lastEspSync).toLocaleString()}</p>
                )}
            </div>
          </div>
           <p className="text-xs text-muted-foreground pt-2 text-center border-t border-dashed">
            For manual update from device: Go to Live, select device, scroll to bottom and tap on 'Sync with Server'.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button size="lg" onClick={() => { window.location.href = 'tel:7979784087'; }}>
          <Phone /> Support
        </Button>
        <Button size="lg" variant="secondary" onClick={() => toast({ title: "Service Request", description: "Your service request has been submitted."})}>
          <Wrench /> Service
        </Button>
      </div>
      
       <Card>
        <CardHeader><CardTitle className="text-base">Receipts</CardTitle></CardHeader>
        <CardContent>
            <Button variant="outline" className="w-full" onClick={() => customerData?.receiptNumber ? toast({title: "Viewing Receipt", description: `Receipt: ${customerData.receiptNumber}`}) : toast({title: "No receipt found"}) }>
              <FileText className="mr-2 h-4 w-4" /> View Last Receipt
            </Button>
        </CardContent>
      </Card>
    </div>
  );
};

    

    