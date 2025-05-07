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
    
    // Funkcja sprawdzająca zmiany w sessionStorage
    const handleStorageChange = () => {
      const currentToken = sessionStorage.getItem("accessToken");
      if (currentToken !== accessToken) {
        console.log("Token dostępu został zaktualizowany");
        setAccessToken(currentToken);
        if (currentToken) {
          fetchCalendars(currentToken);
        }
      }
    };
    
    // Sprawdzaj co 2 sekundy, czy token się zmienił
    const intervalId = setInterval(handleStorageChange, 2000);
    
    return () => clearInterval(intervalId);
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
                  <GoogleCalendarAuth 
                    onAuthSuccess={handleAuthSuccess}
                    onAuthFailure={handleAuthFailure}
                  />
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
                      <div className={`p-2 mb-3 rounded text-sm ${accessToken.startsWith('ya29') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {accessToken.startsWith('ya29') 
                          ? <>✅ Token OAuth2 znaleziony! Pierwsze 10 znaków: {accessToken.substring(0, 10)}...</>
                          : <>⚠️ Znaleziony token nie jest tokenem OAuth2! Typ tokenu: ID Token (JWT)<br/>Pierwsze 10 znaków: {accessToken.substring(0, 10)}...<br/>Zaloguj się ponownie, aby uzyskać prawidłowy token OAuth2.</>
                        }
                      </div>
                      <Calendar accessToken={accessToken} />
                    </>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center justify-center min-h-[300px]">
                      <p className="text-gray-600 dark:text-gray-300 mb-4 text-center">
                        Connect your Google Calendar to view your schedule here.
                      </p>
                      <div className="mb-4 bg-yellow-100 text-yellow-800 p-2 rounded">
                        ⚠️ Nie znaleziono tokenu dostępu. Spróbuj zalogować się ponownie przez Google.
                      </div>
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

              {/* Dodatkowe opcje kalendarza i ręcznego pobierania tokenu */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200">
                  🔑 Diagnostyka tokenu dostępu
                </h3>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="text-sm text-gray-700 dark:text-gray-200">
                    Status: {accessToken ? (
                      <span className="text-green-600 dark:text-green-400">
                        Token dostępny ({accessToken.substring(0, 10)}...)
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        Brak tokenu dostępu
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        const token = sessionStorage.getItem("accessToken");
                        if (token) {
                          setAccessToken(token);
                          alert(`Token znaleziony: ${token.substring(0, 15)}...`);
                          fetchCalendars(token);
                        } else {
                          alert("Nie znaleziono tokenu w sessionStorage");
                        }
                      }}
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
                    >
                      Odśwież token
                    </button>
                    <button
                      onClick={() => {
                        const token = sessionStorage.getItem("accessToken");
                        if (!token) {
                          alert("Brak tokenu w sessionStorage!");
                          return;
                        }
                        
                        console.log("🔄 Testowanie dostępu do Calendar API...");
                        fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        })
                          .then(res => {
                            if (!res.ok) {
                              throw new Error(`Status: ${res.status}`);
                            }
                            return res.json();
                          })
                          .then(data => {
                            console.log("✅ Calendar API działa! Otrzymano listę kalendarzy:", data);
                            alert("✅ Calendar API działa! Sprawdź konsolę, aby zobaczyć listę kalendarzy.");
                          })
                          .catch(err => {
                            console.error("❌ Błąd dostępu do Calendar API:", err);
                            alert(`❌ Błąd dostępu do Calendar API: ${err.message}`);
                          });
                      }}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm ml-2"
                    >
                      Test Calendar API
                    </button>
                    <GoogleCalendarAuth 
                      onAuthSuccess={handleAuthSuccess}
                      onAuthFailure={handleAuthFailure}
                    />
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
