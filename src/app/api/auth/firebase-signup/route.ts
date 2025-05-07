import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { syncUserToMongoDB } from '@/services/userService';
import connectDB from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection is established
    await connectDB();
    
    // Get the token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { name, email, password } = await request.json();
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    try {
      // Verify the Firebase token
      let userData;
      
      if (auth) {
        // If Firebase Admin is initialized, verify the token
        const decodedToken = await auth.verifyIdToken(token);
        const { uid, email, name, picture } = decodedToken;
        
        userData = {
          uid,
          email,
          displayName: name,
          photoURL: picture
        };
      } else {
        // If Firebase Admin is not initialized, use the request body
        userData = {
          email,
          displayName: name,
          // The UID should be provided in the request body if available
          uid: request.headers.get('x-firebase-uid') || undefined
        };
      }
      
      // Sync user to MongoDB
      const user = await syncUserToMongoDB(userData);
      
      return NextResponse.json({
        success: true,
        message: 'User created and synchronized with MongoDB',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          firebaseUid: user.firebaseUid
        }
      }, { status: 201 });
    } catch (error) {
      console.error('Error creating user or verifying token:', error);
      return NextResponse.json(
        { error: 'Authentication error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Firebase signup error:', error);
    return NextResponse.json(
      { error: 'Server error during signup' },
      { status: 500 }
    );
  }
} 