// File: src/components/layout/Navbar.tsx
"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 left-0 w-full z-50 transition-colors ${
        isDark ? "bg-neutral-900" : "bg-white"
      } shadow-md`}
    >
      {/* Ahora la cabecera ocupa 100% de ancho y el contenido va justo pegado a los bordes */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo a la izquierda */}
        <Link href="/" aria-label="Go to home page">
          {isDark ? (
            <Image
              src="/TokenWatcherW.svg"
              alt="TokenWatcher Logo (White)"
              width={140}
              height={36}
            />
          ) : (
            <Image
              src="/TokenWatcherB.svg"
              alt="TokenWatcher Logo (Black)"
              width={140}
              height={36}
            />
          )}
        </Link>

        {/* Menú principal (oculto en pantallas pequeñas) */}
        <nav className="hidden lg:flex items-center space-x-5">
          <Link href="/login">
            <span
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? "text-neutral-200 hover:text-primary"
                  : "text-neutral-800 hover:text-primary"
              } cursor-pointer`}
            >
              Login
            </span>
          </Link>

          <Link
            href="/register"
            className={`inline-block text-white font-semibold px-4 py-2 rounded-lg transition text-sm cursor-pointer ${
              isDark
                ? "bg-accent hover:bg-accent-hover"
                : "bg-primary hover:bg-primary-light"
            }`}
          >
            Sign Up
          </Link>

          <button
            onClick={toggleDark}
            title="Toggle theme"
            className="ml-3 p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.415 0l.707.707A1 1 0 015.939 6.343l-.707-.707a1 1 0 010-1.415zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm8 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.364-2.364a1 1 0 010 1.414l-.707.707a1 1 0 01-1.415-1.415l.707-.707a1 1 0 011.415 0zM10 6a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-neutral-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657A8 8 0 019.343 8.343m8.314 8.314A8 8 0 1112 4.343a8 8 0 00.343 11.657z"
                />
              </svg>
            )}
          </button>
        </nav>

        {/* Botones para vista móvil */}
        <div className="lg:hidden flex items-center space-x-2">
          <button
            onClick={toggleDark}
            className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
          >
            {isDark ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 01-2 0V3a1 1 0 011-1zM4.22 4.22a1 1 0 011.415 0l.707.707A1 1 0 015.939 6.343l-.707-.707a1 1 0 010-1.415zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zm8 6a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.364-2.364a1 1 0 010 1.414l-.707.707a1 1 0 01-1.415-1.415l.707-.707a1 1 0 011.415 0zM10 6a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-neutral-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657A8 8 0 019.343 8.343m8.314 8.314A8 8 0 1112 4.343a8 8 0 00.343 11.657z"
                />
              </svg>
            )}
          </button>
          {/* Aquí podrías añadir un botón de menú hamburguesa si lo necesitas */}
        </div>
      </div>
    </header>
  );
}
