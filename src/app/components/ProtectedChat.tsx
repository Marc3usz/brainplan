'use client';

import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from './ChatInterface';
import Loader from './Loader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedChat() {
  const { isAuthenticated, loading } = useAuth({ required: true, redirectTo: '/login' });
  const router = useRouter();
  
  // Redirect is handled by the useAuth hook, but we add this effect for extra security
  // Check if we're not already on the login page to prevent loops
  useEffect(() => {
    if (!loading && !isAuthenticated && 
        typeof window !== 'undefined' && 
        !window.location.pathname.includes('/login')) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <Loader size="lg" color="white" />
          <p className="mt-4 text-white text-xl">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
} 