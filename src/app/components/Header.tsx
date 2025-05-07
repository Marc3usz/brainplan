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