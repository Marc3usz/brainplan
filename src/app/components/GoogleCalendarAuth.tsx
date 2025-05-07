'use client';

import { useState, useEffect } from 'react';
import { signInWithGoogle } from '@/lib/auth-helper';

interface GoogleCalendarAuthProps {
  onAuthSuccess?: (token: string) => void;
  onAuthFailure?: (error: string) => void;
}

export default function GoogleCalendarAuth({ 
  onAuthSuccess, 
  onAuthFailure 
}: GoogleCalendarAuthProps) {
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  
  // Check if already authenticated
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    // Sprawdź czy token to OAuth2 token (zaczyna się od ya29)
    if (token && token.startsWith('ya29')) {
      setAuthenticated(true);
      if (onAuthSuccess) {
        onAuthSuccess(token);
      }
    } else if (token) {
      console.warn("⚠️ Znaleziony token nie jest tokenem OAuth2. Zaloguj się ponownie.");
      sessionStorage.removeItem('accessToken'); // Usuń nieprawidłowy token
    }
  }, [onAuthSuccess]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    
    try {
      // Użyj Firebase do uwierzytelniania zamiast gapi
      const result = await signInWithGoogle();
      
      if (result.success && result.accessToken) {
        // Sprawdź typ tokenu
        if (result.accessToken.startsWith('ya29')) {
          setAuthenticated(true);
          
          if (onAuthSuccess) {
            onAuthSuccess(result.accessToken);
          }
        } else {
          throw new Error('Nie otrzymano poprawnego tokenu OAuth2');
        }
      } else {
        throw new Error('Nie udało się uzyskać tokenu dostępu');
      }
    } catch (error) {
      console.error('Google Auth Error:', error);
      if (onAuthFailure) {
        onAuthFailure(error instanceof Error ? error.message : 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignOut = () => {
    sessionStorage.removeItem('accessToken');
    setAuthenticated(false);
  };

  return (
    <div>
      {!authenticated ? (
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:border-blue-800 focus:ring ring-blue-300 disabled:opacity-25 transition"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm6.804 16.864H12v-4.72h4.05c-.393-.99-1.495-2.907-4.05-2.907-2.486 0-4.5 2.336-4.5 4.763s2.014 4.763 4.5 4.763c1.463 0 2.214-.368 2.254-.417l1.7 1.646C15.59 20.3 13.932 21 12 21c-4.418 0-8-3.582-8-8s3.582-8 8-8c3.395 0 5.773 2.114 6.804 4.186z" fill="#fff"/>
              </svg>
              Connect with Google Calendar
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center">
          <span className="text-green-600 dark:text-green-400 mr-2">
            ✓ Connected to Google Calendar
          </span>
          <button
            onClick={handleSignOut}
            className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

declare global {
  interface Window {
    gapi: any;
  }
} 