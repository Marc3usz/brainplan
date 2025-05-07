'use client';

import Link from 'next/link';
import AuthStatus from './AuthStatus';

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-lg font-semibold">
                Brain Plan
              </Link>
            </div>
            <nav className="ml-6 flex items-center space-x-4">
              <Link href="/" className="px-3 py-2 text-sm font-medium text-gray-900 hover:text-indigo-600">
                Home
              </Link>
              <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-indigo-600">
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