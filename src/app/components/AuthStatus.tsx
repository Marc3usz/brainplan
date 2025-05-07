'use client';

import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User as FirebaseUser } from 'firebase/auth';
import { initFirebaseAuth, signOutFromFirebase } from '@/lib/auth-helper';
import ProfileImage from './ProfileImage';
import Loader from './Loader';

type CombinedUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  photoURL?: string | null;
  displayName?: string | null;
};

export default function AuthStatus() {
  const { data: session, status } = useSession();
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

  const handleSignOut = async () => {
    // Sign out from both Firebase and NextAuth
    if (firebaseUser) {
      await signOutFromFirebase();
    }
    
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
    <div className="flex items-center gap-4">
      {isLoading ? (
        <Loader size="sm" />
      ) : user ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ProfileImage 
              src={profileImage} 
              alt={displayName} 
              size={32} 
            />
            <span className="text-sm font-medium hidden sm:inline">
              {displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            Sign out
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Link
            href="/auth/signin"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-200"
          >
            Sign up
          </Link>
        </div>
      )}
    </div>
  );
} 