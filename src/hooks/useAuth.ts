import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth({ required = false, redirectTo = '/auth/signin' } = {}) {
  const { data: session, status } = useSession();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // First try to load stored user from localStorage
    try {
      const storedUser = localStorage.getItem('firebaseUser');
      if (storedUser) {
        setFirebaseUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Error loading user from localStorage', e);
      localStorage.removeItem('firebaseUser');
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // If auth is required and there's no user, redirect to login
    if (required && !loading && !session?.user && !firebaseUser) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(window.location.href)}`);
    }
  }, [required, loading, session, firebaseUser, router, redirectTo]);

  // Combine authentication sources
  const isAuthenticated = !!(session?.user || firebaseUser);
  const user = session?.user || firebaseUser;

  return { 
    user, 
    isAuthenticated, 
    loading: loading || status === 'loading'
  };
} 