// File: src/components/layout/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";
import Button from "../ui/button"; // Reutilizamos el componente Button

export default function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Estado para controlar el menú móvil
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // useEffect para evitar errores de hidratación con el tema
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // O un skeleton/loader
  }

  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 left-0 w-full z-50 transition-colors ${isDark ? "bg-[#262626]" : "bg-white"} shadow-md`}>
      <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Logo a la izquierda */}
        <Link href="/" onClick={closeMenu} aria-label="Go to home page">
          {isDark ? (
            <Image src="/TokenWatcherW.svg" alt="TokenWatcher Logo (White)" width={140} height={36} priority />
          ) : (
            <Image src="/TokenWatcherB.svg" alt="TokenWatcher Logo (Black)" width={140} height={36} priority />
          )}
        </Link>

        {/* Menú principal para DESKTOP (oculto en pantallas pequeñas) */}
        <nav className="hidden lg:flex items-center space-x-4">
          <Link href="/login" className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/register" legacyBehavior>
            <Button intent="default" size="md">Sign Up</Button>
          </Link>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDark ? (
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
            ) : (
              <svg className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 1.243a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM19 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.95 14.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 111.414-1.414l.707.707a1 1 0 010 1.414zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM1 10a1 1 0 011-1h1a1 1 0 110 2H2a1 1 0 01-1-1zM5.757 5.757a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 6a4 4 0 100 8 4 4 0 000-8z"></path></svg>
            )}
          </button>
        </nav>

        {/* Botón de hamburguesa para MÓVIL (visible solo en pantallas pequeñas) */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-4 6h4" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Panel del menú móvil (se muestra u oculta según el estado) */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-neutral-800">
          <div className="px-2 pt-2 pb-4 space-y-1">
            <Link href="/login" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
              Login
            </Link>
            <Link href="/register" onClick={closeMenu} className="block px-3 py-2 rounded-md text-base font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800">
              Sign Up
            </Link>
             <div className="px-3 py-2">
                <button
                    onClick={toggleTheme}
                    className="w-full flex justify-between items-center text-left text-base font-medium text-gray-800 dark:text-gray-200"
                >
                    Toggle Theme
                    {isDark ? <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg> : <svg className="h-5 w-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.243 1.243a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM19 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM14.95 14.95a1 1 0 01-1.414 0l-.707-.707a1 1 0 011.414 1.414l.707.707a1 1 0 010 1.414zM10 18a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zM5.05 14.95a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM1 10a1 1 0 011-1h1a1 1 0 110 2H2a1 1 0 01-1-1zM5.757 5.757a1 1 0 010-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707a1 1 0 01-1.414 0zM10 6a4 4 0 100 8 4 4 0 000-8z"></path></svg>}
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}