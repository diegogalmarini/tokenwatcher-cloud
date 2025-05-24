// dashboard/tokenwatcher-app/src/app/login/page.tsx
"use client";

import React, { useState, FormEvent, useEffect } from 'react'; // <--- AÑADE useEffect AQUÍ
import { useAuth } from '@/contexts/AuthContext'; // Ajusta la ruta si es diferente
import Button from '@/components/ui/button'; // Usando tu componente Button
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.replace('/'); // o tu ruta de dashboard principal
    }
  }, [isAuthenticated, isLoading, router]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      // La redirección la maneja el AuthContext tras un login exitoso
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    }
  };
  
  // No mostrar el formulario si está cargando o ya autenticado y esperando redirección
  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          {/* Aquí podrías poner tu logo */}
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to TokenWatcher
          </h2>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 shadow-xl rounded-lg" onSubmit={handleSubmit}>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password? (Not implemented)
              </a>
            </div>
          </div> */}

          <div>
            <Button
              type="submit"
              className="group relative flex w-full justify-center" // Usa tu variante por defecto o especifica una
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
           <p className="mt-2 text-center text-sm text-gray-600">
            No account?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up (Not implemented yet)
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}