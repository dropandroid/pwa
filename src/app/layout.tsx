
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { PwaGate } from '@/components/pwa-gate';
import { NotificationGate } from '@/components/notification-gate';
import { usePathname } from 'next/navigation';
// import manifest from './manifest'; // Metadata can't be dynamic in layout

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <title>Droppurity</title>
        <meta name="description" content="RO Monitor App by Firebase Studio" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <PwaGate>
           <AuthProvider>
              <NotificationGate>
                {children}
                <Toaster />
              </NotificationGate>
            </AuthProvider>
        </PwaGate>
      </body>
    </html>
  );
}
