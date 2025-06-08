// File: dashboard/tokenwatcher-app/src/app/(marketing)/verify-email/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function VerifyEmailPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying…");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing token.");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email?token=${token}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setStatus("success");
          setMessage(data.msg || "Email verified successfully!");
          // Opcional: redirigir a login en 3s
          setTimeout(() => router.replace("/login"), 3000);
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Verification failed");
        }
      })
      .catch((err: any) => {
        console.error("Verify Email Error:", err);
        setStatus("error");
        setMessage(err.message || "An unexpected error occurred.");
      });
  }, [searchParams, router]);

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
            Verify Email
          </h1>

          <div
            className={`mb-6 p-4 rounded ${
              status === "loading"
                ? (isDark ? "bg-gray-800 text-gray-100" : "bg-gray-100 text-gray-900")
                : status === "success"
                ? (isDark ? "bg-green-800 text-gray-100" : "bg-green-100 text-gray-900")
                : (isDark ? "bg-red-800 text-gray-100" : "bg-red-100 text-gray-900")
            }`}
          >
            {message}
          </div>

          {status !== "loading" && (
            <div className="text-center">
              <Link href={status === "success" ? "/login" : "/register"}
                className={`font-medium hover:underline ${isDark ? "text-primary-light" : "text-primary"}`}>
                {status === "success" ? "Go to Sign In" : "Go to Sign Up"}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
