import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb-adapter';
import { Db } from 'mongodb';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// Create or update a user in MongoDB based on Firebase user data
export async function syncUserToMongoDB(firebaseUser: any) {
  if (!firebaseUser || !firebaseUser.email) {
    throw new Error('Invalid user data');
  }
  
  try {
    // Connect to MongoDB using the adapter
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: firebaseUser.email });
    
    if (existingUser) {
      // Update existing user if needed
      const updates: any = {};
      
      if (firebaseUser.displayName && firebaseUser.displayName !== existingUser.name) {
        updates.name = firebaseUser.displayName;
      }
      
      if (firebaseUser.photoURL && firebaseUser.photoURL !== existingUser.image) {
        updates.image = firebaseUser.photoURL;
      }
      
      // Add or update Firebase UID if it's not already set
      if (firebaseUser.uid && (!existingUser.firebaseUid || existingUser.firebaseUid !== firebaseUser.uid)) {
        updates.firebaseUid = firebaseUser.uid;
      }
      
      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const updatedUser = await usersCollection.findOneAndUpdate(
          { email: firebaseUser.email },
          { $set: { ...updates, updatedAt: new Date() } },
          { returnDocument: 'after' }
        );
        
        console.log('User updated in MongoDB:', firebaseUser.email);
        return updatedUser?.value || existingUser;
      }
      
      return existingUser;
    } else {
      // Create new user
      const newUser = {
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0] || 'User',
        email: firebaseUser.email,
        // Store Firebase UID
        firebaseUid: firebaseUser.uid,
        // Generate a random password since Firebase handles authentication
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        image: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || 'User')}&background=random`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(newUser);
      console.log('New user created in MongoDB:', firebaseUser.email);
      
      return { _id: result.insertedId, ...newUser };
    }
  } catch (error) {
    console.error('Error syncing user to MongoDB:', error);
    throw error;
  }
}

// Get a user by Firebase UID
export async function getUserByFirebaseUid(firebaseUid: string) {
  if (!firebaseUid) {
    throw new Error('Firebase UID is required');
  }
  
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Try to find a user with the matching Firebase UID
    const user = await User.findOne({ firebaseUid });
    
    return user;
  } catch (error) {
    console.error('Error getting user by Firebase UID:', error);
    throw error;
  }
} 