import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';

// Function to sync user with MongoDB
async function syncUserWithMongoDB(user: any) {
  if (!user || !user.email) return;
  
  try {
    // Get the ID token
    const idToken = await user.getIdToken(true);
    
    // Prepare user data for the request body
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    
    // Call our API endpoint to sync the user
    const response = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.error('Failed to sync user:', data.error);
    } else {
      console.log('User successfully synced with MongoDB');
    }
  } catch (error) {
    console.error('Error syncing user with MongoDB:', error);
  }
}

// Sign in with Google using Firebase
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const additionalInfo = getAdditionalUserInfo(result);
    
    // Save to localStorage for persistence
    if (user) {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isNewUser: additionalInfo?.isNewUser || false,
      };
      
      localStorage.setItem('firebaseUser', JSON.stringify(userData));
      
      // Set a cookie for server-side auth detection
      document.cookie = `Firebase-Auth-Token=${user.uid}; path=/; max-age=${60*60*24*7}; SameSite=Lax`;
      
      // Sync user with MongoDB
      await syncUserWithMongoDB(user);
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Google sign in error:', error);
    return { success: false, error };
  }
};

// Sign out from Firebase
export const signOutFromFirebase = async () => {
  try {
    await signOut(auth);
    localStorage.removeItem('firebaseUser');
    
    // Clear the auth cookie
    document.cookie = 'Firebase-Auth-Token=; path=/; max-age=0; SameSite=Lax';
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
};

// Initialize Firebase auth state
export const initFirebaseAuth = (callback: (user: any) => void) => {
  // Check localStorage first for quick restore
  const storedUser = localStorage.getItem('firebaseUser');
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      callback(parsedUser);
    } catch (e) {
      localStorage.removeItem('firebaseUser');
    }
  }
  
  // Listen for auth state changes
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const serializedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      localStorage.setItem('firebaseUser', JSON.stringify(serializedUser));
      
      // Sync user with MongoDB on auth state change
      await syncUserWithMongoDB(user);
    } else {
      localStorage.removeItem('firebaseUser');
    }
    
    callback(user);
  });
}; 