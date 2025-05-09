import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Interfejs dla opcji hooka
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
  const { data: session, status: sessionStatus } = useSession();
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [redirectInProgress, setRedirectInProgress] = useState(false);
  const router = useRouter();

  // Efekt dla obsługi Firebase Auth
  useEffect(() => {
    console.log('useAuth: Inicjalizacja Firebase Auth');
    
    // Najpierw próbujemy załadować użytkownika z localStorage (szybki start)
    try {
      const storedUser = localStorage.getItem('firebaseUser');
      if (storedUser) {
        setFirebaseUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('useAuth: Błąd ładowania użytkownika z localStorage', e);
      localStorage.removeItem('firebaseUser');
    }

    // Nasłuchiwanie zmian stanu uwierzytelniania Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('useAuth: Firebase auth state changed:', user ? 'zalogowany' : 'wylogowany');
      
      if (user) {
        // Zapisz dane użytkownika w localStorage dla szybkiego dostępu
        try {
          localStorage.setItem('firebaseUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          }));
          localStorage.setItem('isAuthenticated', 'true');
          
          // Ustaw cookie dla middleware
          document.cookie = `userLoggedIn=true; path=/; max-age=86400; SameSite=Lax`;
        } catch (e) {
          console.error('useAuth: Błąd zapisywania użytkownika w localStorage', e);
        }
      } else {
        // Wyczyść localStorage przy wylogowaniu
        try {
          localStorage.removeItem('firebaseUser');
          localStorage.removeItem('isAuthenticated');
          
          // Usuń cookie
          document.cookie = `userLoggedIn=; path=/; max-age=0; SameSite=Lax`;
        } catch (e) {
          console.error('useAuth: Błąd usuwania użytkownika z localStorage', e);
        }
      }
      
      setFirebaseUser(user);
      setFirebaseLoading(false);
    });

    // Czyszczenie nasłuchiwania przy odmontowaniu komponentu
    return () => unsubscribe();
  }, []);

  // Efekt dla przekierowań na podstawie stanu uwierzytelniania
  useEffect(() => {
    // Czekaj aż oba mechanizmy uwierzytelniania zostaną załadowane
    if (firebaseLoading || sessionStatus === 'loading') {
      return;
    }
    
    // Sprawdź czy jesteśmy uwierzytelnieni
    const isUserAuthenticated = !!(session?.user || firebaseUser);
    
    // Sprawdź czy jesteśmy już na stronie logowania (aby zapobiec zapętleniom)
    const isOnAuthPage = typeof window !== 'undefined' && 
      (window.location.pathname.includes('/login') || 
       window.location.pathname.includes('/auth/signin') || 
       window.location.pathname.includes('/auth/signup'));
    
    // Zapobiegaj wielokrotnym przekierowaniom
    if (redirectInProgress) return;
    
    // Jeśli uwierzytelnienie jest wymagane ale użytkownik nie jest zalogowany
    if (required && !isUserAuthenticated && !isOnAuthPage) {
      console.log(`useAuth: Przekierowanie niezalogowanego użytkownika na ${redirectTo}`);
      
      // Ustaw flagę przekierowania
      setRedirectInProgress(true);
      
      // Dodaj aktualny URL jako parametr callbackUrl
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentPath)}`;
      
      // Zastosuj zarówno router.push jak i window.location dla pewności
      try {
        router.push(redirectUrl);
        
        // Awaryjnie, jeśli router.push nie działa
        setTimeout(() => {
          if (typeof window !== 'undefined' && 
              window.location.pathname !== redirectTo.split('?')[0]) {
            console.log('useAuth: Użycie window.location jako zabezpieczenia');
            window.location.href = redirectUrl;
          }
        }, 500);
      } catch (error) {
        console.error('useAuth: Błąd podczas przekierowania', error);
        // Awaryjne przekierowanie
        if (typeof window !== 'undefined') {
          window.location.href = redirectUrl;
        }
      }
    }
  }, [required, firebaseLoading, firebaseUser, session, sessionStatus, router, redirectTo, redirectInProgress]);

  // Określenie stanu uwierzytelniania
  const isAuthenticated = !!(session?.user || firebaseUser);
  const user = session?.user || firebaseUser;
  const loading = firebaseLoading || sessionStatus === 'loading';

  return { 
    user, 
    isAuthenticated, 
    loading
  };
}