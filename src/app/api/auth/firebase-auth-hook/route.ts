import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { syncUserToMongoDB } from '@/services/userService';
import connectDB from '@/lib/mongodb';
import clientPromise from '@/lib/mongodb-adapter';

// This endpoint handles Firebase auth webhook events
// It can be configured in Firebase to be called when users are created, deleted, etc.
export async function POST(request: Request) {
  try {
    // Ensure MongoDB connection is established
    await connectDB();
    
    // Get the request data
    const data = await request.json();
    const { event, user } = data;
    
    // Verify the request has the required data
    if (!event || !user) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Handle different event types
    switch (event.type) {
      case 'user_created':
        // Sync the new user to MongoDB
        await handleUserCreated(user);
        break;
      case 'user_deleted':
        // Mark the user as deleted in MongoDB or perform other cleanup
        await handleUserDeleted(user);
        break;
      default:
        // For other events, just log them
        console.log(`Unhandled Firebase auth event: ${event.type}`, event);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Firebase auth webhook error:', error);
    return NextResponse.json(
      { error: 'Server error processing auth webhook' },
      { status: 500 }
    );
  }
}

// Handle user creation events
async function handleUserCreated(user: any) {
  try {
    // Sync the user to MongoDB
    await syncUserToMongoDB({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    });
    
    console.log(`User created and synced to MongoDB: ${user.email}`);
  } catch (error) {
    console.error('Error handling user_created event:', error);
    throw error;
  }
}

// Handle user deletion events
async function handleUserDeleted(user: any) {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find and soft-delete the user in MongoDB
    // You might want to implement your own deletion strategy
    const result = await usersCollection.updateOne(
      { firebaseUid: user.uid },
      { 
        $set: { 
          deleted: true,
          deletedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount === 0) {
      console.warn(`No user found in MongoDB with firebaseUid: ${user.uid}`);
    } else {
      console.log(`User soft-deleted in MongoDB: ${user.uid}`);
    }
  } catch (error) {
    console.error('Error handling user_deleted event:', error);
    throw error;
  }
} 