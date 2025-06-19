// src/components/layout/DashboardHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { SunIcon, MoonIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Button from "../ui/button";

export default function DashboardHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { user, isAuthenticated, logout } = useAuth();

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const handleLogout = () => {
    logout();
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
            <>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </button>
              <Link
                href="/dashboard/settings"
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Account Settings"
              >
                  <Cog6ToothIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              </Link>
              {user.is_admin && (
                <Link
                  href="/dashboard/admin"
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Admin Panel"
                >
                    <UserGroupIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </Link>
              )}
            </>
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