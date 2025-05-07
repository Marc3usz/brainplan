'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { initFirebaseAuth } from '@/lib/auth-helper';

export function Providers({ children }: { children: React.ReactNode }) {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    // Initialize Firebase auth state
    const unsubscribe = initFirebaseAuth((user) => {
      console.log('Firebase auth state changed:', user ? 'Signed in' : 'Signed out');
      setFirebaseInitialized(true);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
} 