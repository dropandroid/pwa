
import { NextResponse } from 'next/server';

// Define CORS headers to be reused
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// This is the proxy endpoint. The frontend calls this, and this makes the call to the device.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');

  if (!ip) {
    return NextResponse.json({ error: 'IP address is required' }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    // The fetch must be done from the server, so it needs the full URL.
    const response = await fetch(`${ip}/status`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout to prevent hanging
    });

    if (!response.ok) {
       console.error(`[PROXY] Device at ${ip} responded with status: ${response.status}`);
       return NextResponse.json({ error: `Device responded with status: ${response.status}` }, { status: response.status, headers: CORS_HEADERS });
    }
    
    const data = await response.json();
    // Return the data from the device, along with the necessary CORS headers
    return NextResponse.json(data, { headers: CORS_HEADERS });

  } catch (error: any) {
    console.error(`[PROXY] Failed to fetch from device at ${ip}:`, error.name, error.message);
    let errorMessage = 'Failed to connect to the device. Ensure it is online and the IP is correct.';
    if (error.name === 'AbortError') {
        errorMessage = 'Connection timed out. The device did not respond in time.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 504, headers: CORS_HEADERS }); // 504 Gateway Timeout
  }
}

// This handles the browser's pre-flight 'OPTIONS' request, which is crucial for CORS to work.
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: CORS_HEADERS,
  });
}
