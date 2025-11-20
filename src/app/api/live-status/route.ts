
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get('ip');

  if (!ip) {
    return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
  }

  try {
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const response = await fetch(`http://${ip}/status`, {
        signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Forward the error from the device if possible
      const errorText = await response.text();
      return NextResponse.json({ error: `Device responded with status ${response.status}: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    
    // Add CORS headers to the response to the client
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return NextResponse.json(data, { headers });

  } catch (error: any) {
    console.error(`[API/live-status] Error fetching from ${ip}:`, error);
    if (error.name === 'AbortError') {
        return NextResponse.json({ error: 'Connection timed out. Device did not respond.' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Failed to connect to device. Check IP and network connectivity.' }, { status: 500 });
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { headers });
}
