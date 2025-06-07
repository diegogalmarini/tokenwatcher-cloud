// File: dashboard/tokenwatcher-app/src/app/(marketing)/login/page.tsx
"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const { login, isAuthenticated, isLoading: authLoading, isLoading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Si ya estamos autenticados, redirigimos al Dashboard inmediatamente.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Llamamos al método `login` del contexto. 
      // Este método debe:
      //  1) Hacer fetch al endpoint /auth/token 
      //  2) Guardar el token en localStorage
      //  3) Llamar a fetchUserProfile(...) internamente
      //  4) Actualizar isAuthenticated en el contexto
      await login(email, password);

      // Si login() lanza, el catch lo manejará; si no lanza, 
      // el contexto ya debe haber actualizado isAuthenticated => 
      // useEffect anterior redirige a /dashboard.
    } catch (err: any) {
      setError(err.message || "Error inesperado al iniciar sesión.");
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Back to Home */}
          <Link
            href="/"
            className={`text-sm mb-4 inline-block ${isDark ? "text-gray-300" : "text-gray-700"}`}
          >
            ← Back to Home
          </Link>

          <h1 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
            Sign in to TokenWatcher
          </h1>

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`bg-white dark:bg-[#1C1C1E] shadow-md rounded-lg px-6 py-8 ${
              isDark ? "text-gray-100" : "text-gray-900"
            }`}
          >
            <label className="block mb-2 font-medium">
              Email address
              <input
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDark
                    ? "placeholder-gray-400 text-gray-100"
                    : "placeholder-gray-500 text-gray-900"
                }`}
                required
                autoComplete="email"
              />
            </label>

            <label className="block mb-4 font-medium">
              Password
              <input
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDark
                    ? "placeholder-gray-400 text-gray-100"
                    : "placeholder-gray-500 text-gray-900"
                }`}
                required
                autoComplete="current-password"
              />
            </label>

            {/* ⇨ Enlace "Forgot password?" agregado justo después del campo de contraseña ⇦ */}
            <div className="mb-4 text-right">
              <Link
                href="/forgot-password"
                className={`text-sm font-medium ${
                  isDark ? "text-gray-300 hover:text-gray-200" : "text-primary hover:underline"
                }`}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                isDark
                  ? "bg-primary text-white hover:bg-primary-light disabled:bg-gray-700"
                  : "bg-primary text-white hover:bg-primary-light disabled:bg-gray-300"
              }`}
            >
              {submitting || isLoading ? "Signing in..." : "Sign in"}
            </button>

            <p className={`mt-4 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-700"}`}>
              No account?{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
