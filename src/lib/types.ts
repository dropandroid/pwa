
export interface RODevice {
  deviceName: string;
  serialNumber: string;
  startDate: string;
  endDate: string;
  todayUsage: number;
  monthlyUsage: number;
  dailyLimit: number;
  totalLimit: number;
  status: "active" | "inactive" | "EXPIRED" | "ACTIVE" | string;
  purityLevel: number;
  tdsLevel: number;
  lastServiceDate: string;
  nextServiceDate: string;
  totalLiters: number;
  totalHours: number;
  filterLifeRemaining: number;
  lastUsageTime: string;
}

export interface UsageData {
  day: string;
  usage: number;
  date: string;
  totalLiters?: number;
  previousTotalLiters?: number;
}

export interface AppSettings {
  serviceReminders: boolean;
  lowPurityAlerts: boolean;
  dailyReports: boolean;
  autoRefresh: boolean;
}

export interface Alert {
  type: "error" | "warning" | "info";
  message: string;
  action: string;
}

export interface CustomerData {
  generatedCustomerId: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerPhone: string;
  google_email?: string;
  fcmToken?: string;
  customerPhotoUrl?: string | null;
  
  aadhaarNo?: string;
  altMobileNo?: string | null;
  city?: string;
  confirmedMapLink?: string;
  country?: string;
  currentPlanId?: string;
  currentPlanName?: string;
  currentPlanTotalLitersLimit?: number;
  currentTotalHours?: number;
  currentTotalLitersUsed?: number;
  deviceStatus?: number;
  driveUrl?: string;
  emailId?: string;
  espCycleMaxHours?: number;
  fatherSpouseName?: string;
  installationDate?: string;
  installationTime?: string;
  landmark?: string;
  lastEspSync?: string;
  modelInstalled?: string;
  paymentType?: string;
  pincode?: string;
  planEndDate?: string;
  planExpiryTimestamp?: number;
  planStartDate?: string;
  planStatus?: "active" | "inactive" | "EXPIRED" | "ACTIVE" | string;
  receiptNumber?: string;
  rechargeCount?: number;
  registeredAt?: string;
  securityAmount?: string;
  selectedDivision?: string;
  selectedZone?: string;
  serialNumber?: string;
  stateName?: string;
  tdsAfter?: string | null;
  tdsBefore?: string | null;
  termsAgreed?: boolean;
  updatedAt?: string;
  [key: string]: any; // For any other fields like _verificationStatus
}
