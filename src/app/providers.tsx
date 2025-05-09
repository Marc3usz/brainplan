'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { initFirebaseAuth } from '@/lib/auth-helper';
import { GoogleAuthProvider, getAuth } from 'firebase/auth';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    // Inicjalizacja stanu uwierzytelniania Firebase
    const unsubscribe = initFirebaseAuth((user) => {
      console.log('Firebase auth state changed:', user ? 'Signed in' : 'Signed out');
      
      // Zapisz stan logowania w localStorage dla lepszej persystencji
      if (user) {
        try {
          localStorage.setItem('isAuthenticated', 'true');
        } catch (error) {
          console.error('Error saving auth state to localStorage', error);
        }
      } else {
        try {
          localStorage.removeItem('isAuthenticated');
        } catch (error) {
          console.error('Error removing auth state from localStorage', error);
        }
      }
      
      // Jeśli użytkownik jest zalogowany, sprawdź dostępność tokena OAuth
      if (user) {
        try {
          const auth = getAuth();
          const currentUser = auth.currentUser;
          
          if (currentUser) {
            // Sprawdź, czy użytkownik zalogował się przez Google
            const providers = currentUser.providerData || [];
            const isGoogleProvider = providers.some(
              provider => provider.providerId === 'google.com'
            );
            
            if (isGoogleProvider) {
              // Sprawdź token dostępu w sessionStorage
              const existingToken = sessionStorage.getItem('accessToken');
              console.log('Google provider detected, token available:', !!existingToken);
            }
          }
        } catch (error) {
          console.error('Błąd podczas sprawdzania tokenu:', error);
        }
      }
      
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