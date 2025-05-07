import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Interfejs dla opcji hook'a
interface UseAuthOptions {
  required?: boolean;
  redirectTo?: string;
}

// Typ zwracany przez hook
interface UseAuthReturn {
  user: any;
  isAuthenticated: boolean;
  loading: boolean;
}

export function useAuth({ required = false, redirectTo = '/login' }: UseAuthOptions = {}): UseAuthReturn {
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

    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // If auth is required and there's no user, redirect to login
    // Check if we're not already on the login page to prevent loops
    if (required && !loading && !session?.user && !firebaseUser && 
        typeof window !== 'undefined' && 
        !window.location.pathname.includes(redirectTo)) {
      // Use a simple redirect without complex URL parameters
      router.push(redirectTo);
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