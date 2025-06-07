// File: dashboard/tokenwatcher-app/src/app/(marketing)/reset-password/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

// ====================================================================
// Componente hijo que contiene TODA la lógica del formulario.
// Este es el componente que realmente usa 'useSearchParams'.
// ====================================================================
function ResetPasswordForm() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("token");
    setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Invalid or missing token.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    setStatus("submitting");
    setErrorMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.detail || "Error resetting password");
      }
      setStatus("success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Reset Password Error:", err);
      setErrorMsg(err.message || "An unexpected error occurred");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div
        className={`w-full max-w-md text-center p-4 rounded ${
          isDark
            ? "text-gray-100 bg-green-800"
            : "text-gray-900 bg-green-100"
        }`}
      >
        <p>Password has been reset successfully. Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className={`text-2xl font-bold mb-6 text-center ${isDark ? "text-white" : "text-gray-900"}`}>
        Reset Password
      </h1>
      <form
        onSubmit={handleSubmit}
        className={`bg-white dark:bg-[#1C1C1E] shadow-md rounded-lg px-6 py-8 ${
          isDark ? "text-gray-100" : "text-gray-900"
        }`}
      >
        <label className="block mb-2 font-medium">
          New password
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
              isDark
                ? "placeholder-gray-400 text-gray-100"
                : "placeholder-gray-500 text-gray-900"
            }`}
            required
            minLength={6}
          />
        </label>
        <label className="block mb-4 font-medium">
          Confirm password
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`mt-1 w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-[#2C2C2E] bg-[#e8e8e8] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary ${
              isDark
                ? "placeholder-gray-400 text-gray-100"
                : "placeholder-gray-500 text-gray-900"
            }`}
            required
            minLength={6}
          />
        </label>
        {errorMsg && <p className="mb-4 text-red-500 text-sm">{errorMsg}</p>}
        <button
          type="submit"
          disabled={status === "submitting"}
          className={`w-full py-2 rounded-lg font-semibold transition ${
            status === "submitting" 
              ? "bg-gray-400 cursor-not-allowed"
              : isDark
                ? "bg-primary text-white hover:bg-primary-light"
                : "bg-primary text-white hover:bg-primary-light"
          }`}
        >
          {status === "submitting" ? "Resetting…" : "Reset password"}
        </button>
        <div className="mt-4 text-center">
          <a
            href="/login"
            className={`${isDark ? "text-gray-300" : "text-gray-700"} text-sm hover:underline`}
          >
            ← Back to Sign In
          </a>
        </div>
      </form>
    </div>
  );
}

// ====================================================================
// El componente de la página principal ahora es muy simple.
// Solo se encarga de 'suspender' al componente hijo.
// ====================================================================
export default function ResetPasswordPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  
  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow flex items-center justify-center px-4">
        <Suspense fallback={<div>Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}