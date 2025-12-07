
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { RODevice, UsageData, AppSettings, Alert, CustomerData } from '@/lib/types';
import { calculateDaysRemaining } from '@/lib/helpers';
import { useAuth } from './use-auth';

const LITERS_PER_HOUR = 12;
const USAGE_HISTORY_KEY = 'roUsageHistory';
const RO_SETTINGS_KEY = 'roAppSettings';

const INITIAL_SETTINGS: AppSettings = {
  serviceReminders: true,
  lowPurityAlerts: true,
  dailyReports: false,
  autoRefresh: true,
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
    
    const baseInstallationDate = customerData.installationDate && !isNaN(new Date(customerData.installationDate).getTime())
        ? new Date(customerData.installationDate)
        : new Date();

    const installationDate = baseInstallationDate.toISOString();

    // Placeholder for filter life calculation, assuming a 6000L filter capacity
    const filterLife = 100 - ((totalLiters / 6000) * 100);
    
    const nextServiceDate = new Date(baseInstallationDate);
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);


    return {
      deviceName: customerData.modelInstalled || "My RO Water Purifier",
      serialNumber: customerData.serialNumber || "N/A",
      startDate: customerData.planStartDate || new Date().toISOString(),
      endDate: customerData.planEndDate || new Date().toISOString(),
      todayUsage: 0, // This is a placeholder; real daily usage is calculated in the hook
      monthlyUsage: totalLiters, 
      dailyLimit: customerData.currentPlanTotalLitersLimit || 50,
      totalLimit: totalLimit,
      status: customerData.planStatus || 'inactive',
      purityLevel: 98.2, // Placeholder value
      tdsLevel: parseInt(customerData.tdsAfter || '45', 10),
      lastServiceDate: installationDate, 
      nextServiceDate: nextServiceDate.toISOString(),
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
  const [usageHistory, setUsageHistory] = useState<UsageData[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const updateUsageHistory = useCallback((currentTotalLiters: number) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    setUsageHistory(prevHistory => {
        let newHistory = [...prevHistory];
        const lastEntry = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

        if (lastEntry?.date === todayStr) {
            // It's the same day, update the total liters
             if(lastEntry) lastEntry.totalLiters = currentTotalLiters;
        } else {
             // It's a new day, add a new entry
             newHistory.push({
                 day: today.toLocaleDateString('en-US', { weekday: 'short' }),
                 date: todayStr,
                 usage: 0, // Will be calculated based on the difference
                 totalLiters: currentTotalLiters,
                 previousTotalLiters: lastEntry ? lastEntry.totalLiters : 0,
             });
        }
        
        // Recalculate usage for all entries based on sequential differences
        for(let i = 0; i < newHistory.length; i++) {
            const current = newHistory[i];
            const previousTotal = i > 0 ? newHistory[i-1].totalLiters : current.previousTotalLiters;
            current.usage = Math.max(0, (current.totalLiters || 0) - (previousTotal || 0));
        }

        const finalHistory = newHistory.slice(-7);

        try {
            localStorage.setItem(USAGE_HISTORY_KEY, JSON.stringify(finalHistory));
        } catch (error) {
            console.error("Failed to save usage history to localStorage", error);
        }
        
        // Update today's usage on the main device object
        const todayFinalEntry = finalHistory.find(e => e.date === todayStr);
        if (todayFinalEntry) {
            setRoDevice(prevDevice => ({ ...prevDevice, todayUsage: todayFinalEntry.usage }));
        }

        return finalHistory;
    });
}, []);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await refreshCustomerData();
    setLastUpdated(new Date());
    setIsLoading(false);
  }, [refreshCustomerData]);

  useEffect(() => {
    if (customerData) {
        const newDeviceState = createInitialDeviceState(customerData);
        setRoDevice(newDeviceState);
        updateUsageHistory(newDeviceState.totalLiters);
    }
  }, [customerData, updateUsageHistory]);
  
  // Load initial data from localStorage and then refresh
  useEffect(() => {
    if (!authLoading) {
      try {
          const savedHistory = localStorage.getItem(USAGE_HISTORY_KEY);
          if (savedHistory) {
              setUsageHistory(JSON.parse(savedHistory));
          }
          const savedSettings = localStorage.getItem(RO_SETTINGS_KEY);
          if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
          }
      } catch (error) {
          console.error("Failed to load data from localStorage", error);
      }
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (!roDevice.endDate || roDevice.totalLimit === 0) return;
  
    const isDateExpired = new Date() > new Date(roDevice.endDate);
    const isUsageExceeded = roDevice.totalLiters >= roDevice.totalLimit;
  
    if ((isDateExpired || isUsageExceeded) && roDevice.status?.toLowerCase() !== 'expired') {
      setRoDevice(prev => ({ ...prev, status: 'EXPIRED' }));
    } else if (!(isDateExpired || isUsageExceeded) && roDevice.status?.toLowerCase() === 'expired') {
      setRoDevice(prev => ({ ...prev, status: 'ACTIVE' }));
    }
  
    const alerts: Alert[] = [];
    const daysRemaining = calculateDaysRemaining(roDevice.endDate);
    const usagePercentage = (roDevice.totalLiters / roDevice.totalLimit) * 100;
  
    if (roDevice.status?.toLowerCase() === 'expired') {
      alerts.push({
        type: 'error',
        message: isUsageExceeded ? 'Your usage limit has been exceeded.' : 'Your plan has expired by date.',
        action: 'Recharge'
      });
    } else {
        // Only show these if the plan is not already expired
        if (usagePercentage >= 90) {
            alerts.push({ type: 'error', message: 'You have used 90% of your plan. Recharge now.', action: 'Recharge' });
        } else if (usagePercentage >= 80) {
            alerts.push({ type: 'warning', message: 'You have used 80% of your plan. Recharge soon.', action: 'Recharge' });
        }
    
        if (daysRemaining <= 7 && settings.serviceReminders) {
            alerts.push({ type: 'warning', message: `Plan expires in ${daysRemaining} days.`, action: 'Renew' });
        }
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
  
    setNotifications(alerts);
  }, [roDevice, settings]);
  
  useEffect(() => {
    if (!authLoading) {
        setIsInitialLoading(false);
    }
  }, [authLoading]);

  const toggleSetting = (setting: keyof AppSettings) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [setting]: !prev[setting]
      };
      try {
        localStorage.setItem(RO_SETTINGS_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error("Failed to save settings to localStorage", error);
      }
      return newSettings;
    });
  };

  const addWaterUsage = useCallback(() => {
    // This function is now a no-op as data is read-only from the database.
    // It's kept for API compatibility with components that might still call it.
  }, []);

  return {
    roDevice,
    setRoDevice,
    usageHistory,
    settings,
    toggleSetting,
    notifications,
    isLoading,
    isInitialLoading,
    lastUpdated,
    handleRefresh,
    addWaterUsage,
  };
};
