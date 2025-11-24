
import { NextResponse } from 'next/server';

// This is the endpoint that was previously used for the cron job.
// All logic has been moved to /api/send-expiry-alerts/route.ts
// This endpoint is now a placeholder.
export async function GET(request: Request) {
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, { status: 204 });
    }
    
    return NextResponse.json({ message: "This endpoint is deprecated. Use /api/send-expiry-alerts."});
}
