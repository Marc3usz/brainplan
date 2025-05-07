'use client';
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';
import ProfileImage from '../components/ProfileImage';
import Loader from '../components/Loader';
import Calendar from '../components/Calendar';
import GoogleCalendarAuth from '../components/GoogleCalendarAuth';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth({ required: true });
  const router = useRouter();

  const [calendars, setCalendars] = useState<any[]>([]);
  const [calendarError, setCalendarError] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    setAccessToken(token);

    if (token) {
      fetchCalendars(token);
    }
    
    // Handle storage changes for when token is updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        setAccessToken(e.newValue);
        if (e.newValue) {
          fetchCalendars(e.newValue);
        }
      }
    };
    
    // Use standard event listener instead of polling
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchCalendars = async (token: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        setCalendars(data.items || []);
        setCalendarError('');
      } else {
        setCalendarError(`Błąd API: ${data.error?.message || "Nieznany"}`);
      }
    } catch (err) {
      setCalendarError("Wystąpił błąd przy łączeniu z Google Calendar.");
    }
  };

  const handleAuthSuccess = (token: string) => {
    setAccessToken(token);
    fetchCalendars(token);
  };

  const handleAuthFailure = (error: string) => {
    setCalendarError(`Błąd logowania: ${error}`);
  };

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

  const displayName = user?.displayName || user?.name || 'User';
  const email = user?.email || 'No email provided';
  const profileImage = user?.photoURL || user?.image || null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white dark:bg-gray-900 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-4 mb-6">
                <ProfileImage src={profileImage} alt={displayName} size={64} />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Welcome back, {displayName}!
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400">{email}</p>
                </div>
                <div className="ml-auto">
                  {/* Google Calendar login button moved to calendar section */}
                </div>
              </div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">
                This is your personal dashboard. You're now logged in with {user?.providerId || 'your account'}.
              </p>

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-indigo-800 dark:text-indigo-200">Account Information</h3>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>Name: {displayName}</li>
                    <li>Email: {email}</li>
                  </ul>
                </div>
                
                {/* Calendar Section */}
                <div id="calendar" className="sm:col-span-2">
                  {accessToken ? (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Your Calendar</h3>
                        <GoogleCalendarAuth 
                          onAuthSuccess={handleAuthSuccess}
                          onAuthFailure={handleAuthFailure}
                        />
                      </div>
                      <Calendar accessToken={accessToken} />
                    </>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                        Connect your Google Calendar to view your schedule here.
                      </p>
                      <GoogleCalendarAuth 
                        onAuthSuccess={handleAuthSuccess}
                        onAuthFailure={handleAuthFailure}
                      />
                    </div>
                  )}
                </div>
              </div>

              {accessToken && (
                <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-lg p-4 col-span-3">
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200">📅 Twoje Kalendarze Google</h3>
                  {calendarError && (
                    <p className="text-red-600 dark:text-red-400 mt-2">{calendarError}</p>
                  )}
                  {!calendarError && calendars.length === 0 && (
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Brak kalendarzy do wyświetlenia.</p>
                  )}
                  <ul className="mt-4 list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    {calendars.map((cal) => (
                      <li key={cal.id}>
                        <strong>{cal.summary}</strong> – {cal.id}
                      </li>
                    ))}
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
