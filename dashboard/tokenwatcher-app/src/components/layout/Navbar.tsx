// File: src/components/layout/Navbar.tsx
"use client";

import React, { useState } from "react"; // Importamos useState
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Navbar() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  
  // 1. Estado para controlar si el menú móvil está abierto o cerrado
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <header
      className={`sticky top-0 left-0 w-full z-50 transition-colors ${
        isDark ? "bg-neutral-900" : "bg-white"
      } shadow-md`}
    >
      <div className="flex items-center justify-between px-4 py-3 max-w-screen-xl mx-auto">
        {/* Logo a la izquierda */}
        <Link href="/" aria-label="Go to home page" onClick={() => setIsMenuOpen(false)}>
          {isDark ? (
            <Image src="/TokenWatcherW.svg" alt="TokenWatcher Logo (White)" width={140} height={36} />
          ) : (
            <Image src="/TokenWatcherB.svg" alt="TokenWatcher Logo (Black)" width={140} height={36} />
          )}
        </Link>

        {/* Menú principal para desktop (oculto en pantallas pequeñas) */}
        <nav className="hidden lg:flex items-center space-x-5">
          <Link href="/login" className={`text-sm font-medium transition-colors ${isDark ? "text-neutral-200 hover:text-white" : "text-neutral-800 hover:text-black"}`}>
            Login
          </Link>
          <Link href="/register" className="inline-block text-white font-semibold px-4 py-2 rounded-lg transition text-sm bg-blue-600 hover:bg-blue-700">
            Sign Up
          </Link>
          <button onClick={toggleDark} title="Toggle theme" className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
            {/* SVGs del botón de tema */}
            {isDark ? ( <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg> ) : ( <svg className="h-5 w-5 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> )}
          </button>
        </nav>

        {/* 2. Botón de menú hamburguesa (visible solo en pantallas pequeñas) */}
        <div className="lg:hidden flex items-center">
          <button onClick={toggleDark} title="Toggle theme" className="p-2 rounded-full bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition">
             {isDark ? ( <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg> ) : ( <svg className="h-5 w-5 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg> )}
          </button>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="ml-2 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              // Icono 'X' para cerrar
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              // Icono hamburguesa para abrir
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* 3. Panel del menú móvil (se muestra u oculta según el estado) */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800">
              Login
            </Link>
            <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800">
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}