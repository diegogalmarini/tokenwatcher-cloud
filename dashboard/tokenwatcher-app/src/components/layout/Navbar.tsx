// dashboard/tokenwatcher-app/src/components/layout/Navbar.tsx
"use client";

import Link from 'next/link';
import Button from '@/components/ui/button';

export default function Navbar() {
  return (
    <nav className="w-full bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              TokenWatcher
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium">
              Login
            </Link>
            {/* --- CORRECCIÓN MÁS SIMPLE --- */}
            <Link href="/register" passHref>
              {/* Link envolverá a Button con una <a>. Button recibe las props de <a> a través de passHref y su ref. */}
              <Button intent="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign Up
              </Button>
            </Link>
            {/* --- FIN CORRECCIÓN --- */}
          </div>
          <div className="md:hidden flex items-center">
            <button className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-blue-600 dark:focus:text-blue-400" aria-label="Open menu">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}