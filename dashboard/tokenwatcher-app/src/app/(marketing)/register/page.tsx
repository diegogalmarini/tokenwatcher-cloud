"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function RegisterPage() {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Si el usuario ya está autenticado, podrías redirigirlo aquí
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Lógica para registrar usuario (fetch a tu API)
      // Ejemplo:
      /*
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        throw new Error("Hubo un problema registrando tu cuenta");
      }
      const data = await response.json();
      // Guardar token en contexto o cookie...
      router.replace("/dashboard");
      */
      // Por ahora, simulamos éxito:
      setTimeout(() => {
        setIsLoading(false);
        router.replace("/dashboard");
      }, 500);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
      setIsLoading(false);
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
            Sign up for TokenWatcher
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
              />
            </label>

            <label className="block mb-2 font-medium">
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
              />
            </label>

            <label className="block mb-4 font-medium">
              Confirm Password
              <input
                type="password"
                placeholder=""
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
                  isDark
                    ? "placeholder-gray-400 text-gray-100"
                    : "placeholder-gray-500 text-gray-900"
                }`}
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 rounded-lg font-semibold transition ${
                isDark
                  ? "bg-primary text-white hover:bg-primary-light disabled:bg-gray-700"
                  : "bg-primary text-white hover:bg-primary-light disabled:bg-gray-300"
              }`}
            >
              {isLoading ? "Signing up..." : "Sign up"}
            </button>

            <p className={`mt-4 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-700"}`}>
              Already have an account?{" "}
              <Link href="/login" className={`${isDark ? "text-primary" : "text-primary"} font-medium`}>
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
