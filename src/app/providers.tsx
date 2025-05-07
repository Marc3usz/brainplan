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
    // Initialize Firebase auth state
    const unsubscribe = initFirebaseAuth(async (user) => {
      console.log('Firebase auth state changed:', user ? 'Signed in' : 'Signed out');
      
      // Jeśli użytkownik jest zalogowany, spróbuj uzyskać token dostępu
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
              // Sprawdź, czy w sessionStorage już jest token
              const existingToken = sessionStorage.getItem('accessToken');
              
              // Sprawdź, czy istniejący token jest już tokenem OAuth2
              if (existingToken && existingToken.startsWith('ya29')) {
                console.log('✅ Token OAuth2 już istnieje w sessionStorage, nie nadpisuję');
              } else {
                // Sprawdź, czy możemy uzyskać token OAuth2 bezpośrednio z Firebase
                // Niestety, Firebase Auth nie daje nam bezpośredniego dostępu do OAuth2 token po inicjalizacji
                // Dlatego lepiej korzystać z tokenu uzyskanego przy logowaniu w signInWithGoogle
                console.log('⚠️ Istniejący token nie jest tokenem OAuth2 lub nie istnieje');
                console.log('ℹ️ Należy zalogować się ponownie, aby uzyskać prawidłowy token OAuth2');
              }
            }
          }
        } catch (error) {
          console.error('Błąd podczas uzyskiwania tokenu:', error);
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