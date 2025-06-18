// src/components/layout/DashboardHeader.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "@/components/auth/LogoutButton";
import { usePathname } from 'next/navigation';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function DashboardHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 left-0 w-full z-50 h-16 transition-colors ${
        isDark
          ? "bg-neutral-900 text-white shadow-md"
          : "bg-white text-gray-900 shadow-md"
      }`}
    >
      <div className="w-full h-full flex items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center h-full">
          <div className="relative w-32 h-8 lg:w-36 lg:h-10">
            {isDark ? (
              <img src="/TokenWatcherW.svg" alt="TokenWatcher Dashboard" className="object-contain w-full h-full" />
            ) : (
              <img src="/TokenWatcherB.svg" alt="TokenWatcher Dashboard" className="object-contain w-full h-full" />
            )}
          </div>
        </Link>

        <div className="flex items-center space-x-4 md:space-x-6">
          {isAuthenticated && user ? (
            <>
              <Popover className="relative">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`flex items-center space-x-2 p-2 rounded-md transition-colors ${
                        open 
                          ? (isDark ? 'bg-neutral-700' : 'bg-gray-200')
                          : (isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100')
                      }`}
                    >
                      <span className="hidden sm:inline text-sm font-medium">{user.email}</span>
                      <UserCircleIcon className="h-6 w-6 sm:hidden" />
                    </Popover.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.is_admin ? 'Administrator' : 'User'}</p>
                          </div>
                          <div className="py-1">
                            <Popover.Button as={Link} href="/dashboard/settings" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                <Cog6ToothIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                <span>Account Settings</span>
                            </Popover.Button>
                            {user.is_admin && (
                                <Popover.Button as={Link} href="/dashboard/admin" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    <UserGroupIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                    <span>Admin Panel</span>
                                </Popover.Button>
                            )}
                          </div>
                          <div className="py-1 border-t border-gray-200 dark:border-neutral-700">
                            <Popover.Button as="button" onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" aria-hidden="true" />
                                <span>Logout</span>
                            </Popover.Button>
                          </div>
                        </div>
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm hover:text-gray-500 transition-colors">
                Login
              </Link>
              <Link href="/register" className="ml-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors">
                Sign Up
              </Link>
            </>
          )}

          <button
            onClick={toggleDark}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? "bg-neutral-800 hover:bg-neutral-700"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m8-10h2M2 12H4m15.364-6.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}