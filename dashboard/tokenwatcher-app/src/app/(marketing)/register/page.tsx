// File: dashboard/tokenwatcher-app/src/app/(marketing)/register/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";

export default function RegisterPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to register");
      }
      setStatus("sent");
    } catch (err: any) {
      setError(err.message || "Unexpected error");
      setStatus("error");
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

          {/* Mensaje al enviar */}
          {status === "sent" && (
            <div
              className={`mb-4 p-4 rounded ${
                isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900"
              }`}
            >
              If that email is not already registered, you’ll receive a verification link shortly.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}

          {/* Formulario solo si no hemos enviado aún */}
          {status !== "sent" && (
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block mb-2 font-medium">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <label className="block mb-4 font-medium">
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </label>

              <button
                type="submit"
                disabled={status === "submitting"}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  isDark
                    ? "bg-primary text-white hover:bg-primary-light disabled:bg-gray-700"
                    : "bg-primary text-white hover:bg-primary-light disabled:bg-gray-300"
                }`}
              >
                {status === "submitting" ? "Signing up…" : "Sign up"}
              </button>
            </form>
          )}

          <p className={`mt-4 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-700"}`}>
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
