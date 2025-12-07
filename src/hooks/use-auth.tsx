
"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  signOut as firebaseSignOut,
  Auth,
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { auth, app } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import type { CustomerData } from '@/lib/types';
import { getCustomerByEmail, saveFcmToken, verifyCustomerPin as dbVerifyCustomerPin } from "@/lib/dynamodb";
import { useToast } from "@/hooks/use-toast";
import '@/lib/fcm-listener'; // Import to run the listener code

type CustomerVerificationStatus = 'unverified' | 'verified';
type SignInResult = 'success' | 'unregistered' | 'error';
type NotificationPermissionStatus = NotificationPermission | 'unsupported' | 'loading' | 'prompted';


interface AuthContextType {
  user: User | null;
  auth: Auth;
  loading: boolean;
  customerStatus: CustomerVerificationStatus;
  customerData: CustomerData | null;
  fcmToken: string | object | null;
  notificationPermission: NotificationPermissionStatus;
  setNotificationPermission: (status: NotificationPermissionStatus) => void;
  setCustomerStatus: (status: CustomerVerificationStatus) => void;
  setCustomerData: (data: CustomerData | null) => void;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  requestNotificationPermission: () => Promise<NotificationPermission | 'unsupported'>;
  verifyCustomerPin: (customerId: string, pin: string) => Promise<CustomerData | null>;
  refreshCustomerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CUSTOMER_DATA_STORAGE_KEY = 'dropPurityCustomerData';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerStatus, setCustomerStatusState] = useState<CustomerVerificationStatus>('unverified');
  const [customerData, setCustomerDataState] = useState<CustomerData | null>(null);
  const [fcmToken, setFcmToken] = useState<string | object | null>(null);
  const [pendingToken, setPendingToken] = useState<string | object | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>('loading');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('unsupported');
    }
  }, []);

  const saveTokenToDb = useCallback(async (customerId: string, token: string | object) => {
    console.log(`[DB] Attempting to save token for customerId: ${customerId}`);
    try {
      const success = await saveFcmToken(customerId, token);
      if (success) {
        console.log(`[Auth Hook] API call to save token for ${customerId} finished successfully.`);
      } else {
        console.error(`[Auth Hook] API call to save token for ${customerId} failed.`);
      }
    } catch (error) {
      console.error("[Auth Hook] Error calling saveFcmToken:", error);
    }
  }, []);


  const setCustomerData = useCallback((data: CustomerData | null) => {
      setCustomerDataState(data);
      if (data) {
          try {
              const dataToCache = { ...data, _verificationStatus: 'verified' };
              localStorage.setItem(CUSTOMER_DATA_STORAGE_KEY, JSON.stringify(dataToCache));
              console.log("[Auth Hook] Customer data saved to localStorage.");

              if (pendingToken && data.generatedCustomerId) {
                  console.log(`[Auth Hook] Pending token found. Saving token now for ${data.generatedCustomerId}.`);
                  saveTokenToDb(data.generatedCustomerId, pendingToken);
                  setPendingToken(null); 
              }
          } catch (e) {
              console.error("[Auth Hook] Failed to save customer data to localStorage", e);
          }
      } else {
          localStorage.removeItem(CUSTOMER_DATA_STORAGE_KEY);
          console.log("[Auth Hook] Customer data removed from localStorage.");
      }
  }, [pendingToken, saveTokenToDb]);

  const setCustomerStatus = useCallback((status: CustomerVerificationStatus) => {
    setCustomerStatusState(status);
    if (customerData) {
        const updatedData = { ...customerData, _verificationStatus: status };
        localStorage.setItem(CUSTOMER_DATA_STORAGE_KEY, JSON.stringify(updatedData));
    }
  }, [customerData]);
  
  const refreshCustomerData = useCallback(async () => {
    if (user?.email) {
      console.log("[Auth Hook] Refreshing customer data...");
      const customer = await getCustomerByEmail(user.email);
      setCustomerData(customer); 
    }
  }, [user, setCustomerData]);


  const handleAuthSuccess = async (user: User): Promise<SignInResult> => {
     const userEmail = user.email;
     if (!userEmail) {
       throw new Error("Could not retrieve email from the user.");
     }
     setUser(user);
     const customer = await getCustomerByEmail(userEmail);
     if (customer) {
       router.push('/verify-customer');
       return 'success';
     } else {
       return 'unregistered';
     }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCustomerData(null);
      setCustomerStatus('unverified');
      router.push('/login');
    } catch (error) {
      console.error("Error signing out", error);
       toast({
          variant: "destructive",
          title: "Sign-Out Error",
          description: "Could not sign out properly. Please try again.",
      });
    }
  };

  const requestNotificationPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported in this browser.');
        setNotificationPermission('unsupported');
        return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      try {
        const messaging = getMessaging(app);
        const currentToken = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
        if (currentToken) {
          const subscription = await navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription());
          const tokenToSend = subscription ? subscription.toJSON() : currentToken;
          
          setFcmToken(tokenToSend);
          if (customerData?.generatedCustomerId) {
            console.log('FCM Token:', tokenToSend);
            await saveTokenToDb(customerData.generatedCustomerId, tokenToSend);
          } else {
            console.log('Customer data not ready, holding token in pending state.');
            setPendingToken(tokenToSend);
          }
        } else {
          console.log('No registration token available.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
    return permission;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      let cachedData: CustomerData | null = null;
      let status: CustomerVerificationStatus = 'unverified';
      
      setUser(user); // Set user immediately

      if (user) {
        try {
          const cachedDataString = localStorage.getItem(CUSTOMER_DATA_STORAGE_KEY);
          if (cachedDataString) {
            const parsedData = JSON.parse(cachedDataString);
            if (parsedData.emailId === user.email || parsedData.google_email === user.email) {
              cachedData = parsedData;
              status = parsedData._verificationStatus || 'unverified';
            } else {
              localStorage.removeItem(CUSTOMER_DATA_STORAGE_KEY);
            }
          }
        } catch (e) {
          console.error("Failed to parse customer data from localStorage", e);
          localStorage.removeItem(CUSTOMER_DATA_STORAGE_KEY);
        }
      } else {
        localStorage.removeItem(CUSTOMER_DATA_STORAGE_KEY);
      }
      
      setCustomerDataState(cachedData);
      setCustomerStatusState(status);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
     if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then(function(registration) {
          console.log('Service Worker registered with scope:', registration.scope);
        }).catch(function(error) {
          console.log('Service Worker registration failed:', error);
        });
        
        const messaging = getMessaging(app);
        onMessage(messaging, (payload) => {
            console.log('Message received. ', payload);
            toast({
                title: payload.notification?.title,
                description: payload.notification?.body,
            });
        });
     }
  }, [toast]);

   useEffect(() => {
    if (loading) return;

    const isPublicPage = pathname === '/login' || pathname === '/verify-customer' || pathname.startsWith('/admin') || pathname === '/install';

    if (!user && !isPublicPage) {
      router.push('/login');
      return;
    }

    if (user) {
      if (customerStatus === 'unverified' && !isPublicPage) {
        router.push('/verify-customer');
      } else if (customerStatus === 'verified' && (pathname === '/login' || pathname === '/verify-customer')) {
        router.push('/');
      }
    }

  }, [user, customerStatus, loading, pathname, router]);

  const signInWithGoogle = async (): Promise<SignInResult> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      return await handleAuthSuccess(result.user);
    } catch (error) {
      console.error("Error during sign-in process:", error);
      if ((error as any).code !== 'auth/popup-closed-by-user') {
          toast({
              variant: "destructive",
              title: "Sign-In Error",
              description: "An unexpected error occurred. Please try again.",
          });
      }
      await firebaseSignOut(auth);
      setUser(null);
      return 'error';
    }
  };

  const verifyCustomerPin = async (customerId: string, pin: string): Promise<CustomerData | null> => {
      if (!user?.email) {
          console.error("verifyCustomerPin called without a user email.");
          return null;
      }
      const data = await dbVerifyCustomerPin(customerId, pin, user.email, fcmToken || pendingToken);
      if (data) {
          setCustomerData(data);
          setCustomerStatus('verified');
      }
      return data;
  };

  return (
    <AuthContext.Provider value={{ user, auth, loading, customerStatus, customerData, fcmToken, notificationPermission, setNotificationPermission, setCustomerStatus, setCustomerData, signInWithGoogle, signOut, requestNotificationPermission, verifyCustomerPin, refreshCustomerData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
