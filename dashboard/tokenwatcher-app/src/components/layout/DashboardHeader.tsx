"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserGroupIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Button from "../ui/button";

export default function DashboardHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { user, isAuthenticated, logout } = useAuth();

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 left-0 w-full z-50 h-16 transition-colors ${
        isDark
          ? "bg-neutral-900 text-white shadow-sm shadow-neutral-800/50"
          : "bg-white text-gray-900 shadow-md"
      }`}
    >
      <div className="w-full h-full flex items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center h-full">
          <div className="relative w-32 h-8 lg:w-36 lg:h-10">
            {isDark ? (
              <img src="/TokenWatcherW.svg" alt="TokenWatcher Dashboard" className="object-contain w-full h-full" />
            ) : (
              <img src="/TokenWatcherB.svg" alt="TokenWatcher Dashboard" className="object-contain w-full h-full" />
            )}
          </div>
        </Link>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {isAuthenticated && user ? (
              <Popover className="relative">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`flex items-center space-x-2 p-2 rounded-full transition-colors focus:outline-none ring-2 ring-offset-2 ring-offset-transparent focus:ring-blue-500 ${
                        open 
                          ? (isDark ? 'bg-neutral-700' : 'bg-gray-200')
                          : (isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100')
                      }`}
                    >
                      <span className="hidden sm:inline text-sm font-medium">{user.email}</span>
                      <UserCircleIcon className="h-6 w-6 text-gray-700 dark:text-gray-300 sm:hidden" />
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
                      <Popover.Panel className="absolute right-0 z-10 mt-2.5 w-64 origin-top-right rounded-md bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-neutral-700">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate" title={user.email}>{user.email}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.is_admin ? 'Administrator' : 'User'}</p>
                          </div>
                          <div className="py-1">
                            <Popover.Button as={Link} href="/dashboard/settings" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                                <span>Account Settings</span>
                            </Popover.Button>
                            {user.is_admin && (
                                <Popover.Button as={Link} href="/dashboard/admin" className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700">
                                    <UserGroupIcon className="mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                                    <span>Admin Panel</span>
                                </Popover.Button>
                            )}
                          </div>
                          <div className="py-1 border-t border-gray-200 dark:border-neutral-700">
                            <Popover.Button as="button" onClick={logout} className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
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
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                Login
              </Link>
              <Button as={Link} href="/register">
                Sign Up
              </Button>
            </>
          )}

          <button
            onClick={toggleDark}
            className="p-2 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-gray-300" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}