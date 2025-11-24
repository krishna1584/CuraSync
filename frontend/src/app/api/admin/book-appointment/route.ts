import { NextRequest, NextResponse } from 'next/server';
import { API_URL } from '@/config/api';

export async function POST(request: NextRequest) {
  try {
    // Forward the request to the backend
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const response = await fetch(`${API_URL}/admin/book-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader || '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin booking proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}