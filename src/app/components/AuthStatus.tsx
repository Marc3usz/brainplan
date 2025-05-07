'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User as FirebaseUser } from 'firebase/auth';
import { initFirebaseAuth, signOutFromFirebase } from '@/lib/auth-helper';
import ProfileImage from './ProfileImage';
import Loader from './Loader';
import { Session } from 'next-auth';

// Rozszerzony typ sesji, który może zawierać accessToken
interface ExtendedSession extends Session {
  accessToken?: string;
}

type CombinedUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  photoURL?: string | null;
  displayName?: string | null;
};

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const extendedSession = session as ExtendedSession;
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = initFirebaseAuth((user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Zapisz token dostępu z nextAuth do sessionStorage
  useEffect(() => {
    if (extendedSession?.accessToken) {
      // Sprawdź, czy token to token OAuth2
      if (extendedSession.accessToken.startsWith('ya29')) {
        sessionStorage.setItem('accessToken', extendedSession.accessToken);
        console.log('✅ Zapisano token OAuth2 z sesji NextAuth do sessionStorage');
      } else {
        console.log('⚠️ Token z sesji NextAuth nie jest tokenem OAuth2:', extendedSession.accessToken.substring(0, 10));
      }
    }
  }, [extendedSession]);

  const handleSignOut = async () => {
    // Sign out from both Firebase and NextAuth
    if (firebaseUser) {
      await signOutFromFirebase();
    }
    
    // Usuń token z sessionStorage przy wylogowaniu
    sessionStorage.removeItem('accessToken');
    
    await nextAuthSignOut({ callbackUrl: '/' });
  };

  // Combine user data from both sources
  const user: CombinedUser | null = session?.user 
    ? { 
        ...session.user, 
        photoURL: null, 
        displayName: session.user.name 
      } 
    : firebaseUser 
    ? {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        image: firebaseUser.photoURL,
        photoURL: firebaseUser.photoURL,
        displayName: firebaseUser.displayName
      }
    : null;
  
  const isLoading = status === 'loading' || loading;
  const displayName = user?.name || user?.displayName || user?.email || 'User';
  const profileImage = user?.image || user?.photoURL || null;

  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {isLoading ? (
        <Loader size="sm" />
      ) : user ? (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <ProfileImage 
              src={profileImage} 
              alt={displayName} 
              size={28} 
            />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline text-gray-800">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex gap-1 sm:gap-2">
          <Link
            href="/auth/signin"
            className="rounded-md bg-indigo-600 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md bg-gray-100 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
} 