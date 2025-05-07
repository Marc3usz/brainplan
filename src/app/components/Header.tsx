'use client';

import Link from 'next/link';
import AuthStatus from './AuthStatus';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 justify-between">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Brain Plan
              </Link>
            </div>
            <nav className="ml-3 sm:ml-6 flex items-center space-x-2 sm:space-x-4">
              <Link href="/" className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-900 hover:text-indigo-600">
                Home
              </Link>
              <Link href="/dashboard" className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link href="/dashboard#calendar" className="px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-600 flex items-center">
                <span>Calendar</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <AuthStatus />
          </div>
        </div>
      </div>
    </header>
  );
} 