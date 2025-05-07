'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithGoogle } from '@/lib/auth-helper';
import Loader from './Loader';

interface GoogleSignInButtonProps {
  redirectUrl?: string;
}

export default function GoogleSignInButton({ redirectUrl }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Use redirectUrl prop or get from URL or default to home
  const callbackUrl = redirectUrl || searchParams?.get('callbackUrl') || '/';

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Sign in with Google
      const result = await signInWithGoogle();
      
      if (result.success) {
        console.log('Google sign in successful', result.user);
        
        // Redirect to a simple callback URL
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError('Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 text-sm text-red-600">{error}</div>
      )}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 sm:gap-3 rounded-md bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70"
      >
        {loading ? (
          <Loader size="sm" className="mr-2" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
            </g>
          </svg>
        )}
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
    </div>
  );
} 