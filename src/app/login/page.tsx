'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import GoogleSignInButton from '../components/GoogleSignInButton';
import Loader from '../components/Loader';

export default function LoginPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Use simple callback URL, defaulting to root
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  // Only redirect to callback URL if user is authenticated and callback is not the login page itself
  useEffect(() => {
    if (isAuthenticated && callbackUrl !== '/login') {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <Loader size="lg" />
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
                      href={`/auth/signin?callbackUrl=${callbackUrl}`}
                      className="text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Use email and password instead
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 