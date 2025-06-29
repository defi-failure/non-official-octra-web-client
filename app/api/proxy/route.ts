import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // The incoming request is from our client (e.g., SWR hook)
    const { method, endpoint, rpcUrl, payload } = await request.json();

    if (!rpcUrl || !endpoint) {
      return NextResponse.json({ error: 'Missing rpcUrl or endpoint' }, { status: 400 });
    }

    const url = `${rpcUrl}${endpoint}`;

    // Server-side request to the actual Octra RPC endpoint using fetch
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: method === 'POST' ? JSON.stringify(payload) : undefined,
      // Revalidate cache every 5 seconds on the server
      next: { revalidate: 5 }
    });

    // Check if the RPC call was successful
    if (!response.ok) {
      const errorText = await response.text();
      // Try to parse as JSON, but fall back to text if it fails
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        errorJson = { error: errorText || 'RPC Error' };
      }
      return NextResponse.json(errorJson, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Proxy Error:', error.message);
    return NextResponse.json(
      { error: 'An unexpected error occurred in the proxy.' },
      { status: 500 }
    );
  }
}