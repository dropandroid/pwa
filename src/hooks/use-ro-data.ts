
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { RODevice, UsageData, AppSettings, Alert, CustomerData } from '@/lib/types';
import { calculateDaysRemaining } from '@/lib/helpers';
import { useAuth } from './use-auth';

const LITERS_PER_HOUR = 12;

const INITIAL_USAGE_HISTORY: UsageData[] = [
  { day: 'Mon', usage: 0, date: '2024-09-02' },
  { day: 'Tue', usage: 0, date: '2024-09-03' },
  { day: 'Wed', usage: 0, date: '2024-09-04' },
  { day: 'Thu', usage: 0, date: '2024-09-05' },
  { day: 'Fri', usage: 0, date: '2024-09-06' },
  { day: 'Sat', usage: 0, date: '2024-09-07' },
  { day: 'Sun', usage: 0, date: '2024-09-08' }
];

const INITIAL_SETTINGS: AppSettings = {
  usageAlerts: true,
  serviceReminders: true,
  lowPurityAlerts: true,
  dailyReports: false,
  autoRefresh: false // Disabled by default for real data
};

const createInitialDeviceState = (customerData: CustomerData | null): RODevice => {
    if (!customerData) {
        return {
            deviceName: "Not Connected",
            serialNumber: "",
            startDate: "",
            endDate: "",
            todayUsage: 0,
            monthlyUsage: 0,
            dailyLimit: 0,
            totalLimit: 0,
            status: "inactive",
            purityLevel: 0,
            tdsLevel: 0,
            lastServiceDate: "",
            nextServiceDate: "",
            totalLiters: 0,
            totalHours: 0,
            filterLifeRemaining: 0,
            lastUsageTime: "",
        };
    }
    
    const totalHours = customerData.currentTotalHours || 0;
    const totalLiters = totalHours * LITERS_PER_HOUR;
    const maxHours = customerData.espCycleMaxHours || 1;
    const totalLimit = maxHours * LITERS_PER_HOUR;
    
    // Placeholder for filter life calculation
    const filterLife = 100 - ((totalLiters / 6000) * 100);

    return {
      deviceName: customerData.modelInstalled || "My RO Water Purifier",
      serialNumber: customerData.serialNumber || "N/A",
      startDate: customerData.planStartDate || new Date().toISOString(),
      endDate: customerData.planEndDate || new Date().toISOString(),
      todayUsage: 0, // This is not available in the data, so it remains a placeholder
      monthlyUsage: totalLiters, 
      dailyLimit: customerData.currentPlanTotalLitersLimit || 50, // daily limit seems separate
      totalLimit: totalLimit,
      status: customerData.planStatus || 'inactive',
      purityLevel: 98.2, // Placeholder
      tdsLevel: parseInt(customerData.tdsAfter || '45', 10),
      lastServiceDate: customerData.installationDate || new Date().toISOString(), 
      nextServiceDate: new Date(new Date(customerData.installationDate || Date.now()).setMonth(new Date(customerData.installationDate || Date.now()).getMonth() + 3)).toISOString(),
      totalLiters: totalLiters,
      totalHours: totalHours,
      filterLifeRemaining: Math.max(0, filterLife),
      lastUsageTime: customerData.lastEspSync || customerData.updatedAt || new Date().toISOString()
    };
}


export const useRoData = () => {
  const { customerData, refreshCustomerData, loading: authLoading } = useAuth();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [roDevice, setRoDevice] = useState<RODevice>(createInitialDeviceState(customerData));
  const [usageHistory, setUsageHistory] = useState<UsageData[]>(INITIAL_USAGE_HISTORY);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Update device state whenever customerData changes
    setRoDevice(createInitialDeviceState(customerData));
    if (customerData) {
      setLastUpdated(new Date(customerData.lastEspSync || customerData.updatedAt || Date.now()));
    }
  }, [customerData]);

  // This function is now just for triggering a re-fetch of customer data
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await refreshCustomerData();
    setIsLoading(false);
  }, [refreshCustomerData]);

  useEffect(() => {
    if (!roDevice.endDate) return;
    const alerts: Alert[] = [];
    const daysRemaining = calculateDaysRemaining(roDevice.endDate);
    
    if (daysRemaining <= 30 && settings.serviceReminders) {
      alerts.push({
        type: 'warning',
        message: `Plan expires in ${daysRemaining} days`,
        action: 'Renew'
      });
    }

    if (roDevice.status?.toLowerCase() === 'expired') {
       alerts.push({
        type: 'error',
        message: 'Your plan has expired.',
        action: 'Recharge'
      });
    }
    
    if (roDevice.filterLifeRemaining <= 20 && settings.lowPurityAlerts) {
      alerts.push({
        type: 'error',
        message: 'Filter replacement required soon',
        action: 'Order'
      });
    }
    
    if (roDevice.tdsLevel > 50 && settings.lowPurityAlerts) {
      alerts.push({
        type: 'error',
        message: 'Water quality declining - TDS high',
        action: 'Check'
      });
    }
    
    if (roDevice.purityLevel < 97 && settings.lowPurityAlerts) {
      alerts.push({
        type: 'warning',
        message: 'Water purity below optimal level',
        action: 'Service'
      });
    }
    
    const nextServiceDate = roDevice.nextServiceDate ? new Date(roDevice.nextServiceDate) : null;
    if (nextServiceDate) {
        const today = new Date();
        const serviceDays = Math.ceil((nextServiceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (serviceDays <= 7 && settings.serviceReminders) {
            alerts.push({
                type: 'info',
                message: `Service due in ${serviceDays} days`,
                action: 'Schedule'
            });
        }
    }
    
    setNotifications(alerts);
  }, [roDevice, settings]);
  
  useEffect(() => {
    if (!authLoading) {
        setIsInitialLoading(false);
    }
  }, [authLoading]);

  const toggleSetting = (setting: keyof AppSettings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const addWaterUsage = useCallback(() => {
    // This function is now a no-op as data is read-only from the database.
    // It's kept for API compatibility with components that might still call it.
  }, []);

  return {
    roDevice,
    setRoDevice, // Kept for things like mock plan extension, etc.
    usageHistory,
    settings,
    toggleSetting,
    notifications,
    isLoading,
    isInitialLoading,
    lastUpdated,
    handleRefresh,
    addWaterUsage, // No-op function
  };
};
