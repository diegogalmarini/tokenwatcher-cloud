// src/components/layout/DashboardHeader.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import LogoutButton from "@/components/auth/LogoutButton";

export default function DashboardHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { user, isAuthenticated } = useAuth();

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
        {/* IZQUIERDA: Logo */}
        <Link href="/dashboard" className="flex items-center h-full">
          <div className="relative w-32 h-8 lg:w-36 lg:h-10">
            {isDark ? (
              <img
                src="/TokenWatcherW.svg"
                alt="TokenWatcher Dashboard"
                className="object-contain w-full h-full"
              />
            ) : (
              <img
                src="/TokenWatcherB.svg"
                alt="TokenWatcher Dashboard"
                className="object-contain w-full h-full"
              />
            )}
          </div>
        </Link>

        {/* DERECHA: Menú de usuario y acciones */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {isAuthenticated && user ? (
            <>
              {/* --- NUEVO: Enlace condicional al Panel de Admin --- */}
              {user.is_admin && (
                <Link
                  href="/dashboard/admin"
                  className="text-sm font-semibold text-blue-500 hover:underline"
                >
                  Admin Panel
                </Link>
              )}
              <span className="hidden sm:inline text-sm">Hello, {user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm hover:text-gray-500 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="ml-4 px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-hover transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Botón para alternar Light/Dark */}
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
              /* Ícono SOL */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m8-10h2M2 12H4m15.364-6.364l1.414 1.414M4.222 19.778l1.414-1.414M19.778 19.778l-1.414-1.414M4.222 4.222l1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              /* Ícono LUNA */
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}