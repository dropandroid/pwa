
import { NextResponse } from 'next/server';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { CustomerData } from '@/lib/types';

// --- DynamoDB Client Initialization ---
const client = new DynamoDBClient({
  region: process.env.DROPPURITY_AWS_REGION,
  credentials: {
    accessKeyId: process.env.DROPPURITY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.DROPPURITY_AWS_SECRET_ACCESS_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const CUSTOMERS_TABLE = "droppurity-customers";
const LOGS_TABLE = "droppurity-notification-logs";
const LITERS_PER_HOUR = 12;

// --- Firebase Admin SDK Initialization ---
const initializeFirebaseAdmin = (): App | null => {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (getApps().length) {
    return getApps()[0];
  }
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      const app = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log("[Firebase Admin] Initialized successfully for notifications.");
      return app;
    } catch (e) {
      console.error("[Firebase Admin] Error parsing service account key:", e);
      return null;
    }
  } else {
    console.warn("[Firebase Admin] Service account key not found. Skipping initialization.");
    return null;
  }
};


// Helper to log notification
const logNotification = async (customerId: string, message: string, triggerType: 'auto' | 'manual', status: 'sent' | 'failed', error?: string) => {
    const logId = `${new Date().toISOString()}-${customerId}`;
    const command = new PutCommand({
        TableName: LOGS_TABLE,
        Item: {
            logId,
            customerId,
            sentAt: new Date().toISOString(),
            message,
            triggerType,
            status,
            error,
        }
    });
    try {
        await docClient.send(command);
    } catch (dbError) {
        console.error(`[CRITICAL] Failed to write notification log for customer ${customerId}:`, dbError);
    }
};

// --- Core Expiry Check Logic ---
export async function runExpiryCheck(triggerType: 'auto' | 'manual' = 'auto') {
    console.log(`[Expiry Check / ${triggerType}] Starting process.`);
    
    const adminApp = initializeFirebaseAdmin();

    const scanCommand = new ScanCommand({ TableName: CUSTOMERS_TABLE });
    let customers: CustomerData[] = [];
    let sentCount = 0;
    let failedCount = 0;
    const details = [];

    try {
        const { Items } = await docClient.send(scanCommand);
        customers = (Items as CustomerData[]) || [];
        console.log(`[Expiry Check] Found ${customers.length} customers to process.`);
    } catch (error) {
        console.error("[Expiry Check] Error fetching customers:", error);
        return { message: 'Failed to fetch customers', error, processedCount: 0, sent: 0, failed: 0 };
    }

    const messaging = adminApp ? getMessaging(adminApp) : null;
    if (!messaging) {
        console.warn("[Expiry Check] Firebase Messaging not initialized. Cannot send notifications.");
    }

    for (const customer of customers) {
        if (!customer.fcmToken) {
            continue; 
        }

        let notificationTitle = '';
        let notificationBody = '';
        let shouldSend = false;
        let notificationReasons: string[] = [];
        let bodyParts: string[] = [];
        
        const endDate = customer.planEndDate ? new Date(customer.planEndDate) : null;
        if(endDate) endDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = endDate ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;

        const maxHours = customer.espCycleMaxHours || 0;
        const currentHours = customer.currentTotalHours || 0;
        const totalLitersUsed = currentHours * LITERS_PER_HOUR;
        const totalLitersLimit = maxHours > 0 ? maxHours * LITERS_PER_HOUR : 0;
        
        const isExpiredByDate = diffDays !== null && diffDays < 0;
        const isExpiredByUsage = maxHours > 0 && currentHours >= maxHours;
        

        if (isExpiredByDate || isExpiredByUsage) {
            const expiryReasons = [];
            if (isExpiredByDate) expiryReasons.push('date');
            if (isExpiredByUsage) expiryReasons.push(`usage limit (${totalLitersUsed.toFixed(0)}L)`);
            
            notificationTitle = 'Plan Expired';
            notificationBody = `Your Drop Purity plan has expired due to ${expiryReasons.join(' and ')}. Please recharge to restore service.`;
            shouldSend = true;
            notificationReasons.push('expired');
        } 
        else {
            if (maxHours > 0) {
                const usage90 = maxHours * 0.9;
                const usage80 = maxHours * 0.8;

                if (currentHours >= usage90 && !customer.notifiedFor90Percent) {
                    bodyParts.push(`you have used over 90% of your allowance (${totalLitersUsed.toFixed(0)}/${totalLitersLimit.toFixed(0)}L)`);
                    notificationReasons.push('usage_90');
                } else if (currentHours >= usage80 && !customer.notifiedFor80Percent) {
                    bodyParts.push(`you have used over 80% of your allowance (${totalLitersUsed.toFixed(0)}/${totalLitersLimit.toFixed(0)}L)`);
                    notificationReasons.push('usage_80');
                }
            }

            if (diffDays !== null && diffDays <= 7) {
                const dayString = diffDays <= 1 ? '1 day' : `${diffDays} days`;
                bodyParts.push(`your plan will expire in ${dayString}`);
                notificationReasons.push('date_warning');
            }

            if (bodyParts.length > 0) {
                shouldSend = true;
                notificationTitle = 'Plan Reminder';
                notificationBody = `Alert: ${bodyParts.join(' and ')}. Please recharge to avoid service interruption.`;
            }
        }

        if (shouldSend) {
            const message = {
                notification: { title: notificationTitle, body: notificationBody },
                token: customer.fcmToken,
            };

            try {
                if (!messaging) throw new Error("Messaging not initialized");
                await messaging.send(message);
                console.log(`[Expiry Check] Notification sent to ${customer.generatedCustomerId}: ${notificationBody}`);
                sentCount++;
                details.push({ customerId: customer.generatedCustomerId, status: 'SENT', reason: notificationTitle });
                await logNotification(customer.generatedCustomerId, notificationBody, triggerType, 'sent');
                
                if (notificationReasons.includes('usage_90')) {
                    const updateCommand = new UpdateCommand({
                        TableName: CUSTOMERS_TABLE,
                        Key: { generatedCustomerId: customer.generatedCustomerId },
                        UpdateExpression: "set notifiedFor90Percent = :val",
                        ExpressionAttributeValues: { ":val": true }
                    });
                    await docClient.send(updateCommand);
                }
                if (notificationReasons.includes('usage_80')) {
                     const updateCommand = new UpdateCommand({
                        TableName: CUSTOMERS_TABLE,
                        Key: { generatedCustomerId: customer.generatedCustomerId },
                        UpdateExpression: "set notifiedFor80Percent = :val",
                        ExpressionAttributeValues: { ":val": true }
                    });
                    await docClient.send(updateCommand);
                }

            } catch (error) {
                failedCount++;
                const isTokenError = (error as any).code === 'messaging/registration-token-not-registered';
                const errorMessage = isTokenError
                    ? 'FCM token is not registered.'
                    : (error as Error).message;

                details.push({ customerId: customer.generatedCustomerId, status: 'FAILED', reason: errorMessage });
                await logNotification(customer.generatedCustomerId, notificationBody, triggerType, 'failed', errorMessage);
                console.error(`[Expiry Check] Failed to send notification to ${customer.generatedCustomerId}:`, errorMessage);

                if (isTokenError) {
                    console.log(`[Expiry Check] Invalid token for ${customer.generatedCustomerId}. Removing from database.`);
                    const removeTokenCommand = new UpdateCommand({
                        TableName: CUSTOMERS_TABLE,
                        Key: { generatedCustomerId: customer.generatedCustomerId },
                        UpdateExpression: "remove fcmToken",
                    });
                    try {
                        await docClient.send(removeTokenCommand);
                        console.log(`[Expiry Check] Successfully removed fcmToken for ${customer.generatedCustomerId}.`);
                    } catch (dbError) {
                         console.error(`[Expiry Check] Failed to remove fcmToken for ${customer.generatedCustomerId}:`, dbError);
                    }
                }
            }
        }
    }

    const result = {
        message: 'Expiry check completed.',
        processedCount: customers.length,
        sent: sentCount,
        failed: failedCount,
        details,
    };
    console.log('[Expiry Check] Process finished.', result);
    return result;
}


// --- Netlify Function Handler ---
export async function GET(request: Request) {
    console.log('[AUTO TRIGGER /api/send-expiry-alerts] Function invoked by Netlify schedule.');
    
    // Check for a secret header to prevent unauthorized access
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const result = await runExpiryCheck('auto');
        return NextResponse.json(result);
    } catch (error) {
        console.error('[AUTO TRIGGER] An uncaught error occurred during the expiry check:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred';
        return NextResponse.json({ message: 'Scheduled Task Failed', error: errorMessage }, { status: 500 });
    }
}
