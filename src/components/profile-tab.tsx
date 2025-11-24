
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { LogOut, User as UserIcon, Mail, Phone, MapPin, BadgeCheck, CalendarDays, ShieldAlert, FileArchive, X } from 'lucide-react';
import { useRoData } from '@/hooks/use-ro-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProfileTabProps = ReturnType<typeof useRoData>;

export const ProfileTab: FC<ProfileTabProps> = ({ setRoDevice }) => {
  const { toast } = useToast();
  const { user, signOut, customerData } = useAuth();
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);

  const handleExtendRental = () => {
    if (!customerData?.planEndDate) return;
    const extendedDate = new Date(customerData.planEndDate);
    extendedDate.setFullYear(extendedDate.getFullYear() + 1);
    
    // This is a mock update for the UI. In a real app, this would be a backend call.
    setRoDevice(prev => ({
      ...prev,
      endDate: extendedDate.toISOString().split('T')[0]
    }));
    toast({ title: "Rental Extended", description: "Your plan has been extended by 1 year!" });
  };
  
  const handleEndRental = () => {
    toast({ title: "Request Submitted", description: "Rental termination request submitted. We will contact you soon." });
  };
  
  const handleEditProfile = () => {
      toast({ title: "Coming Soon!", description: "Profile editing feature will be available soon."})
  }
  
  const handleViewDocuments = () => {
    if (customerData?.driveUrl) {
      setIsDocumentViewerOpen(true);
    } else {
      toast({ variant: 'destructive', title: "No Documents Found", description: "There is no document link associated with this account." });
    }
  };

  const getPlanStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <BadgeCheck className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <ShieldAlert className="w-4 h-4 text-destructive" />;
      default:
        return <BadgeCheck className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto bg-primary text-white flex items-center justify-center ring-4 ring-primary/20">
              <AvatarImage src={customerData?.customerPhotoUrl || user?.photoURL || undefined} alt={customerData?.customerName || user?.displayName || "User"} />
              <AvatarFallback>
                <UserIcon className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
          <CardTitle className="text-xl mt-4">{customerData?.customerName || user?.displayName}</CardTitle>
          <CardDescription>Customer ID: {customerData?.generatedCustomerId || 'N/A'}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
              <span className="font-medium">{customerData?.emailId || user?.email}</span>
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
              <span className="font-medium">{customerData?.customerPhone}</span>
            </div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-3 text-muted-foreground shrink-0 mt-0.5" />
              <span className="font-medium">{customerData?.customerAddress}, {customerData?.customerCity}, {customerData?.stateName} - {customerData?.pincode}</span>
            </div>
            <div className="flex items-center">
              {getPlanStatusIcon(customerData?.planStatus)}
              <span className="font-medium ml-3">{customerData?.currentPlanName || 'N/A'}</span>
            </div>
            <div className="flex items-center">
              <CalendarDays className="w-4 h-4 mr-3 text-muted-foreground" />
              <span className="font-medium">Member since {customerData?.registeredAt ? new Date(customerData.registeredAt).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader><CardTitle className="text-base">Account Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
            <Button className="w-full" onClick={handleEditProfile}>Edit Profile</Button>
            {customerData?.driveUrl && (
              <Button variant="outline" className="w-full" onClick={handleViewDocuments}>
                <FileArchive className="mr-2 h-4 w-4" />
                View Documents
              </Button>
            )}
            <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700" onClick={handleExtendRental}>Extend Plan</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">End Plan</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Ending your plan will schedule a device pickup and deactivate your account at the end of the current billing cycle.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEndRental} className="bg-destructive hover:bg-destructive/90">Confirm</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </CardContent>
      </Card>

      <div className="pt-4">
        <Button variant="ghost" className="w-full" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>

       <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
            <DialogContent className="p-0 border-0 max-w-full w-full h-full max-h-screen">
                <div className="w-full h-full bg-background flex flex-col">
                     <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                        <DialogTitle>Customer Documents</DialogTitle>
                     </DialogHeader>
                     {customerData?.driveUrl && (
                        <iframe
                            src={customerData.driveUrl.replace("/view", "/preview")}
                            className="w-full h-full border-0 flex-1"
                            title="Customer Documents"
                            sandbox="allow-scripts allow-same-origin allow-forms"
                        ></iframe>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
};
