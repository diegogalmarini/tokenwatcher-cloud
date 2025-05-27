// dashboard/tokenwatcher-app/src/app/login/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      // La redirección la maneja el AuthContext o el useEffect de arriba
    } catch (err: unknown) { // <--- CORREGIDO: de 'any' a 'unknown'
      let errorMessage = 'An unknown error occurred during login.'; // Default English message
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string' && err.trim() !== '') {
        errorMessage = err;
      }
      // Puedes verificar si el error viene de la API con una estructura específica
      // Por ejemplo, si tu API devuelve { detail: "mensaje" }
      // if (typeof err === 'object' && err !== null && 'detail' in err && typeof (err as any).detail === 'string') {
      //   errorMessage = (err as any).detail;
      // }
      setError(errorMessage);
    }
  };

  if (isLoading || (isAuthenticated && !isLoading)) { // Muestra loading si está cargando o si está autenticado pero aún no ha redirigido
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Sign in to TokenWatcher
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 shadow-xl rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md"> {/* Eliminado shadow-sm aquí, ya está en el form principal */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              intent="default" // Asegúrate que tu Button acepte esto o usa className
              className="group relative flex w-full justify-center bg-blue-600 hover:bg-blue-700 text-white" // Estilo primario
              disabled={isLoading}
              size="md"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
           <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            No account?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Sign up (Not implemented yet)
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}