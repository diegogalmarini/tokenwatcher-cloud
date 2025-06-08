"use client"
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function VerifyEmailPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = currentTheme === 'dark';

  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'verifying'|'success'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }
    setStatus('verifying');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`)
      .then(res => {
        if (!res.ok) throw new Error('Verification failed');
        return res.json();
      })
      .then(({ msg }) => {
        setStatus('success');
        setMessage(msg || 'Email verified.');
        setTimeout(() => router.push('/login'), 2000);
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.message || 'Verification error.');
      });
  }, [searchParams, router]);

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-[#121212]' : 'bg-[#e8e8e8]'}`}>
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Verify Your Email
          </h1>
          {status === 'verifying' && <p>Verifying…</p>}
          {(status === 'success' || status === 'error') && (
            <div
              className={`mb-4 p-4 rounded ${
                status === 'success'
                  ? (isDark ? 'bg-green-800 text-gray-100' : 'bg-green-100 text-gray-900')
                  : (isDark ? 'bg-red-800 text-gray-100' : 'bg-red-100 text-gray-900')
              }`}
            >
              {message}
            </div>
          )}
          {status !== 'verifying' && (
            <button
              onClick={() => router.push('/login')}
              className="mt-4 text-primary hover:underline"
            >
              ← Back to Sign In
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
