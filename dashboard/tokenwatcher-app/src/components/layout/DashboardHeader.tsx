"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import Button from "../ui/button";

// Componente para un solo enlace de navegación
const NavLink = ({ href, current, children }: { href: string; current: boolean; children: React.ReactNode; }) => (
  <Link href={href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      current 
      ? 'bg-gray-100 text-blue-600 dark:bg-neutral-800 dark:text-blue-400'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
  }`}>
    {children}
  </Link>
);

export default function DashboardHeader() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const navItems = user ? [
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Events', href: '/dashboard/events', current: pathname.startsWith('/dashboard/events') },
    { name: 'Billing', href: '/dashboard/billing', current: pathname.startsWith('/dashboard/billing') },
    { name: 'Settings', href: '/dashboard/settings', current: pathname.startsWith('/dashboard/settings') },
    ...(user.is_admin ? [{ name: 'Admin Panel', href: '/dashboard/admin', current: pathname.startsWith('/dashboard/admin') }] : []),
  ] : [];

  return (
    <header
      className={`sticky top-0 left-0 w-full z-50 h-16 transition-colors border-b ${
        isDark
          ? "bg-neutral-900/80 border-neutral-800 backdrop-blur-sm"
          : "bg-white/80 border-gray-200 backdrop-blur-sm"
      }`}
    >
      <div className="w-full h-full flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <div className="relative w-32 h-8">
              <img src={isDark ? "/TokenWatcherW.svg" : "/TokenWatcherB.svg"} alt="TokenWatcher Dashboard" className="object-contain w-full h-full" />
            </div>
          </Link>
          {/* Menú de Navegación del Dashboard */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map(item => (
                <NavLink key={item.name} href={item.href} current={item.current}>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {isAuthenticated && user ? (
            <>
              <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">{user.email}</span>
              <Button onClick={logout} intent="secondary" size="sm">
                Logout
              </Button>
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
