import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  getAdditionalUserInfo,
  User,
  updateProfile,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

// Type definition for sync function result
interface SyncResult {
  success: boolean;
  user?: any;
  error?: any;
  accessToken?: string;
}

/**
 * Creates a new user with email and password in Firebase
 * and syncs the user to MongoDB
 */
export async function createUserWithFirebase(email: string, password: string, displayName?: string): Promise<SyncResult> {
  try {
    // Create user in Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user profile if displayName is provided
    if (displayName) {
      await updateUserProfile(user, { displayName });
    }
    
    // Sync the user with MongoDB
    await syncUserWithMongoDB(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Error creating user with Firebase:', error);
    return { success: false, error };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<SyncResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Sync with MongoDB in case user data has changed
    await syncUserWithMongoDB(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Email sign in error:', error);
    return { success: false, error };
  }
}

/**
 * Sign in with Google popup
 */
export async function signInWithGoogle(): Promise<SyncResult> {
  try {
    // Force re-authentication to get a new token
    googleProvider.setCustomParameters({
      prompt: 'consent select_account',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    const user = result.user;

    // Zapisz token dostępu Google (OAuth2) do sessionStorage
    if (accessToken) {
      sessionStorage.setItem("accessToken", accessToken);
      console.log("✅ Zapisano Google OAuth2 Access Token do sessionStorage");
      console.log(`✅ Token zaczyna się od: ${accessToken.substring(0, 10)}...`);
      
      // Dodatkowa weryfikacja czy to na pewno token OAuth2
      if (accessToken.startsWith('ya29')) {
        console.log("✅ Weryfikacja tokenu: Poprawny format tokenu OAuth2 (ya29...)");
      } else {
        console.warn("⚠️ Uwaga: Token nie zaczyna się od 'ya29', co może oznaczać, że to nie jest token OAuth2");
      }
    } else {
      console.error("❌ Nie uzyskano tokenu OAuth2 - Calendar API nie będzie działać!");
      // Spróbuj pobrać token bezpośrednio z tokenu ID
      try {
        await user.getIdToken(true).then((idToken) => {
          console.log("⚠️ Uzyskano tylko ID Token, który nie zadziała z Calendar API.");
        });
      } catch (tokenError) {
        console.error("❌ Nie udało się uzyskać żadnego tokenu:", tokenError);
      }
    }

    // Synchronizacja z MongoDB
    await syncUserWithMongoDB(user);

    return { success: true, user, accessToken };
  } catch (error) {
    console.error("Google sign in error:", error);
    return { success: false, error };
  }
}

/**
 * Sign out from Firebase
 */
export async function signOutFromFirebase(): Promise<SyncResult> {
  try {
    await signOut(auth);
    
    // Usuń dane użytkownika z localStorage
    localStorage.removeItem('firebaseUser');
    
    // Usuń token Google z sessionStorage
    sessionStorage.removeItem('accessToken');
    console.log("✅ Usunięto Google Access Token z sessionStorage");
    
    // Clear the auth cookie
    document.cookie = 'Firebase-Auth-Token=; path=/; max-age=0; SameSite=Lax';
    
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
}

/**
 * Update user profile in Firebase
 */
async function updateUserProfile(user: User, profileData: { displayName?: string, photoURL?: string }): Promise<void> {
  try {
    await updateProfile(user, profileData);
    console.log("User profile updated");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Initialize Firebase auth state
 */
export function initFirebaseAuth(callback: (user: any) => void) {
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
}

/**
 * Sync Firebase user with MongoDB
 */
export async function syncUserWithMongoDB(user: any) {
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
      return null;
    } else {
      console.log('User successfully synced with MongoDB');
      return await response.json();
    }
  } catch (error) {
    console.error('Error syncing user with MongoDB:', error);
    return null;
  }
} 