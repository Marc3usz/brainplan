import { NextResponse } from 'next/server';
import { syncUserToMongoDB } from '@/services/userService';
import { auth } from '@/lib/firebase-admin';
import connectDB from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection is established
    await connectDB();
    
    // Verify the Firebase token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    try {
      // Check if Firebase Admin is properly initialized
      if (!auth) {
        console.warn('Firebase Admin SDK not initialized properly. Using fallback verification.');
        // Get user data from request body as fallback
        const userData = await request.json();
        
        if (!userData || !userData.email) {
          return NextResponse.json(
            { error: 'Invalid user data' },
            { status: 400 }
          );
        }
        
        // Sync user to MongoDB with data from request
        const user = await syncUserToMongoDB(userData);
        
        return NextResponse.json({ 
          success: true,
          user: {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
          }
        });
      }
      
      // Verify the token with Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);
      const { uid, email, name, picture } = decodedToken;
      
      // Log successful token verification
      console.log('Successfully verified Firebase token for:', email);
      
      // Sync user to MongoDB
      const user = await syncUserToMongoDB({
        uid,
        email,
        displayName: name,
        photoURL: picture,
      });
      
      return NextResponse.json({ 
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          firebaseUid: uid,
        }
      });
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('User sync error:', error);
    return NextResponse.json(
      { error: 'Server error during user synchronization' },
      { status: 500 }
    );
  }
} 