import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb-adapter';
import { Db } from 'mongodb';

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