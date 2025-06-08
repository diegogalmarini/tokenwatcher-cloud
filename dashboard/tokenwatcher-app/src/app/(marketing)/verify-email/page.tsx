// File: dashboard/tokenwatcher-app/src/app/(marketing)/verify-email/page.tsx
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// ====================================================================
// Componente hijo que contiene la lógica que usa useSearchParams
// ====================================================================
function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification link. Please request a new one.');
      return;
    }

    setStatus('verifying');
    // CORREGIDO: Se elimina la configuración { method: 'POST' } para que la petición sea un GET por defecto.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null); // Intenta parsear JSON incluso en errores
        if (!res.ok) {
          // Usa el mensaje de error del backend si está disponible
          throw new Error(data?.detail || 'Verification failed. The link may be expired or invalid.');
        }
        return data;
      })
      .then((data) => {
        setStatus('success');
        setMessage(data?.msg || 'Your email has been successfully verified.');
        // Redirigir al login después de unos segundos
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err: Error) => {
        setStatus('error');
        setMessage(err.message || 'An unexpected verification error occurred.');
      });
  }, [searchParams, router]);

  // Renderiza el mensaje según el estado
  if (status === 'verifying') {
    return <p className="text-gray-900 dark:text-gray-100">Verifying your email...</p>;
  }
  
  return (
    <div className="w-full max-w-md text-center">
      <h1 className={`text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100`}>
        Email Verification
      </h1>
      <div
        className={`mb-4 p-4 rounded-lg ${
          status === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}
      >
        <p className="font-semibold">{status === 'success' ? 'Success!' : 'Error'}</p>
        <p>{message}</p>
      </div>
      <Link href="/login" className="mt-4 text-primary hover:underline">
        ← Back to Sign In
      </Link>
    </div>
  );
}


// ====================================================================
// El componente de la página principal que se exporta por defecto.
// Es simple y solo se encarga de 'suspender' al componente hijo.
// ====================================================================
export default function VerifyEmailPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#121212]">
      <main className="flex-grow flex items-center justify-center px-4">
        <Suspense fallback={<div className="text-center text-gray-900 dark:text-gray-100">Loading verification...</div>}>
          <VerifyEmailStatus />
        </Suspense>
      </main>
    </div>
  );
}