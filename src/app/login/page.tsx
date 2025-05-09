'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Loader from '../components/Loader';

export default function LoginPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  // Pobierz URL do przekierowania po logowaniu, domyślnie dashboard
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  // Przekieruj zalogowanego użytkownika do callbackUrl
  useEffect(() => {
    if (isAuthenticated && !loading && !redirectAttempted) {
      console.log('LoginPage: User is authenticated, redirecting to', callbackUrl);
      setRedirectAttempted(true);
      
      // Użyj bezpośredniego przekierowania zamiast Next.js router
      window.location.href = callbackUrl;
    }
  }, [isAuthenticated, loading, callbackUrl, redirectAttempted]);

  // Stan który pozwoli nam śledzić czy próbowano logowania
  useEffect(() => {
    // Po pewnym czasie uznaj, że próbowano logowania
    const timer = setTimeout(() => {
      setLoginAttempted(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (isAuthenticated) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader size="lg" />
            <p className="mt-4 text-lg">Redirecting you...</p>
            <button 
              onClick={() => window.location.href = callbackUrl}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Click here if you're not redirected automatically
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-10 sm:py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sign in to Brain Plan
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-500 dark:text-gray-400">
              Access your AI chat and personalized experience
            </p>
          
            <div className="mt-6 sm:mt-8 space-y-4">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6">
                <div className="space-y-6">
                  <GoogleSignInButton redirectUrl={callbackUrl} />
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <a 
                      href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Use email and password instead
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Informacje pomocnicze dla użytkownika */}
              {loginAttempted && (
                <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
                  <p className="font-medium">Masz problem z logowaniem?</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Upewnij się, że masz włączone cookies w przeglądarce</li>
                    <li>Spróbuj wyczyścić pamięć podręczną i cookies</li>
                    <li>Jeśli korzystasz z blokerów reklam, wyłącz je dla tej strony</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}