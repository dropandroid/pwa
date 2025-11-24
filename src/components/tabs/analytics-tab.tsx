
"use client";

import type { FC } from 'react';
import { Download, Share, CheckCircle, AlertCircle, Droplets, TrendingUp } from 'lucide-react';
import { useRoData } from '@/hooks/use-ro-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { UsageChart } from '../charts/usage-chart';
import { getDaysElapsed } from '@/lib/helpers';

type AnalyticsTabProps = ReturnType<typeof useRoData>;

export const AnalyticsTab: FC<AnalyticsTabProps> = ({ roDevice, usageHistory }) => {
  const { toast } = useToast();
  
  const dailyUsages = usageHistory.map(d => d.usage).filter(u => u > 0);
  const weeklyAverage = dailyUsages.length > 0 ? dailyUsages.reduce((sum, usage) => sum + usage, 0) / dailyUsages.length : 0;
  const maxDailyUsage = dailyUsages.length > 0 ? Math.max(...dailyUsages) : 0;
  const minDailyUsage = dailyUsages.length > 0 ? Math.min(...dailyUsages) : 0;
  
  const totalDays = getDaysElapsed(roDevice.startDate);
  const overallAverage = totalDays > 0 ? roDevice.totalLiters / totalDays : 0;
  const isTodayUsageHigh = roDevice.todayUsage > overallAverage && overallAverage > 0;


  const exportData = () => {
    const exportContent = {
      device: roDevice,
      history: usageHistory,
      exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(exportContent, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `droppurity-data-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "Data Exported", description: "Your usage data has been downloaded." });
  };
  
  const handleShare = () => {
    const shareText = `My Drop Purity Report: Total usage is ${roDevice.totalLiters.toFixed(1)}L and weekly average is ${weeklyAverage.toFixed(1)}L/day.`;
    if (navigator.share) {
      navigator.share({
        title: 'My Drop Purity Usage Report',
        text: shareText,
        url: window.location.href
      }).then(() => toast({ title: "Report Shared" }))
        .catch(error => console.error('Error sharing', error));
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Report Copied", description: "Usage report copied to clipboard." });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Usage Analytics</h2>
        <Button variant="ghost" size="sm" onClick={exportData}>
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-primary">Total Usage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{roDevice.totalLiters.toFixed(1)}L</p>
            <p className="text-xs text-primary/80">All time</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-700">Overall Avg</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{overallAverage.toFixed(1)}L</p>
            <p className="text-xs text-green-600/80">Per day</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Peak Day</p><p className="text-lg font-bold text-accent">{maxDailyUsage.toFixed(1)}L</p></Card>
          <Card className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Low Day</p><p className="text-lg font-bold text-green-600">{minDailyUsage.toFixed(1)}L</p></Card>
          <Card className="p-3 text-center"><p className="text-xs text-muted-foreground mb-1">Today</p><p className="text-lg font-bold text-primary">{roDevice.todayUsage.toFixed(1)}L</p></Card>
      </div>

      <UsageChart usageHistory={usageHistory} maxDailyUsage={maxDailyUsage} weeklyAverage={weeklyAverage} />
      
      <Card>
          <CardHeader><CardTitle className="text-base">Smart Insights</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            
            {isTodayUsageHigh ? (
                 <div className="flex items-start p-3 bg-amber-500/10 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-800 font-semibold">High Usage Alert</p>
                        <p className="text-amber-700/90">
                            Your usage today ({roDevice.todayUsage.toFixed(1)}L) is higher than your average of {overallAverage.toFixed(1)}L/day.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-800 font-semibold">Usage On Track</p>
                    <p className="text-green-700/90">Your consumption today is within your normal average.</p>
                  </div>
                </div>
            )}
            
            {maxDailyUsage > weeklyAverage * 1.5 && weeklyAverage > 0 && (
              <div className="flex items-start p-3 bg-accent/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-accent mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-800 font-semibold">Peak Usage Alert</p>
                  <p className="text-amber-700/90">Your highest usage day was {maxDailyUsage.toFixed(1)}L, which is significantly above your average.</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start p-3 bg-primary/10 rounded-lg">
              <Droplets className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-primary-800 font-semibold">Water Quality Trend</p>
                <p className="text-primary-700/90">Filter efficiency is at {Math.round(roDevice.filterLifeRemaining)}%. Plan for replacement soon.</p>
              </div>
            </div>
          </CardContent>
      </Card>
      
      <Button size="lg" className="w-full" onClick={handleShare}>
          <Share className="mr-2 h-4 w-4" /> Share Report
      </Button>
    </div>
  );
};
