'use client';

import { useAuth } from '@/hooks/useAuth';
import Header from '../components/Header';
import { useRouter } from 'next/navigation';
import ProfileImage from '../components/ProfileImage';
import Loader from '../components/Loader';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth({ required: true });
  const router = useRouter();

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
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 