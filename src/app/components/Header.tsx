'use client';

import Link from 'next/link';
import AuthStatus from './AuthStatus';
import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
        <div className="flex h-14 sm:h-16 justify-between items-center">
          <div className="flex items-center">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-base sm:text-lg font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Brain Plan
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="ml-3 sm:ml-6 hidden sm:flex items-center space-x-2 sm:space-x-4">
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
          
          <div className="flex items-center gap-2">
            <AuthStatus />
            
            {/* Mobile Menu Button */}
            <button 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:hidden"
              onClick={toggleMenu}
              aria-expanded={menuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {menuOpen && (
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:text-white hover:bg-indigo-600"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-600"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard#calendar" 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-600 flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              <span>Calendar</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
} 