'use client';

import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from './ChatInterface';
import Loader from './Loader';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedChat() {
  const { isAuthenticated, loading } = useAuth({ required: true, redirectTo: '/login' });
  const router = useRouter();
  
  // Przekierowanie jest już obsługiwane przez hook useAuth, ale dodajemy dodatkowe zabezpieczenie
  useEffect(() => {
    // Sprawdź, czy użytkownik nie jest zalogowany i nie jest już na stronie logowania
    if (!loading && !isAuthenticated) {
      console.log('ProtectedChat: Użytkownik nie jest zalogowany, przekierowuję na stronę logowania');
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
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-center">
          <p className="text-white text-xl">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <ChatInterface />
    </div>
  );
}