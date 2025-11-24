
"use client";

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import type { Alert as AlertType } from '@/lib/types';
import { Info, XCircle, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationsProps {
  notifications: AlertType[];
}

const alertConfig = {
  error: {
    icon: XCircle,
    className: "bg-destructive/10 border-destructive text-destructive",
    buttonClass: "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
  },
  warning: {
    icon: TriangleAlert,
    className: "bg-accent/80 border-accent text-accent-foreground",
    buttonClass: "bg-accent hover:bg-accent/90 text-accent-foreground",
  },
  info: {
    icon: Info,
    className: "bg-primary/10 border-primary text-primary",
    buttonClass: "bg-primary hover:bg-primary/90 text-primary-foreground",
  },
};

export function Notifications({ notifications }: NotificationsProps) {

  return (
    <div className="space-y-2">
        {notifications.map((notification, index) => {
          const config = alertConfig[notification.type];
          const Icon = config.icon;
          return (
            <div key={index} className={cn("border-l-4 p-3 rounded-r-lg", config.className)}>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Icon className="w-5 h-5 mr-3 shrink-0" />
                  <span className="text-sm font-medium">{notification.message}</span>
                </div>
                <Button size="sm" className={cn("text-xs h-7", config.buttonClass)}>
                  {notification.action}
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}
