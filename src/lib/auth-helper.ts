import { auth, googleProvider } from './firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  getAdditionalUserInfo
} from 'firebase/auth';

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
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const serializedUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      };
      localStorage.setItem('firebaseUser', JSON.stringify(serializedUser));
    } else {
      localStorage.removeItem('firebaseUser');
    }
    
    callback(user);
  });
}; 