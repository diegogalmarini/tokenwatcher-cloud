// dashboard/tokenwatcher-app/src/app/register/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext'; // Asumimos que podríamos añadir una función de registro aquí
import Button from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // Para el enlace a login

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga propio del formulario
  const { isAuthenticated, isLoading: authIsLoading } = useAuth(); // Para redirigir si ya está logueado
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      router.replace('/'); // Redirigir al dashboard si ya está autenticado
    }
  }, [isAuthenticated, authIsLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) { // Ejemplo de validación simple
        setError("Password must be at least 8 characters long.");
        return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Asumimos que el backend devuelve un error con un campo "detail"
        throw new Error(data.detail || `HTTP error! status: ${response.status}`);
      }

      // Registro exitoso
      setSuccessMessage("Registration successful! Please proceed to login.");
      // Opcionalmente, redirigir a login después de un momento o directamente
      setTimeout(() => {
        router.push('/login');
      }, 3000); // Redirigir a login después de 3 segundos

    } catch (err: unknown) {
      let errorMessage = 'An unknown error occurred during registration.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string' && err.trim() !== '') {
        errorMessage = err;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // No mostrar el formulario si auth está cargando o ya autenticado
  if (authIsLoading || (isAuthenticated && !authIsLoading)) {
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
            Create your TokenWatcher Account
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 shadow-xl rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900 p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900 p-3">
              <p className="text-sm text-green-700 dark:text-green-300">{successMessage}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password" name="password" type="password" autoComplete="new-password" required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Password (min. 8 characters)" value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required
                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-700"
                placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              intent="default"
              className="group relative flex w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
              size="md"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
           <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}