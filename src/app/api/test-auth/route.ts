import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      status: 'success',
      message: 'NextAuth is configured correctly',
      session: session ? 'User is logged in' : 'No active session',
      env: {
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        hasUrl: !!process.env.NEXTAUTH_URL,
        hasMongoUri: !!process.env.MONGODB_URI,
      }
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Error testing auth configuration',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 