"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        // Puede devolver 400/500 si sucede algo extraño
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Error al enviar el correo");
      }
      setStatus("sent");
    } catch (err: any) {
      console.error("Forgot Password Error:", err);
      setErrorMsg(err.message || "Ocurrió un error inesperado");
      setStatus("error");
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"
      }`}
    >
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1
            className={`text-2xl font-bold mb-6 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Recuperar contraseña
          </h1>

          {status === "sent" ? (
            <div
              className={`mb-4 ${
                isDark ? "text-gray-100 bg-gray-800 p-4 rounded" : "text-gray-900 bg-gray-100 p-4 rounded"
              }`}
            >
              <p>
                Si ese correo está registrado, acabas de recibir un email con
                instrucciones para restablecer tu contraseña.
              </p>
            </div>
          ) : (
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

              {errorMsg && (
                <p className="mb-4 text-red-500 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  isDark
                    ? "bg-primary text-white hover:bg-primary-light disabled:bg-gray-700"
                    : "bg-primary text-white hover:bg-primary-light disabled:bg-gray-300"
                }`}
              >
                {status === "sending" ? "Enviando..." : "Enviar correo de recuperación"}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
            <Link
              href="/login"
              className={`${isDark ? "text-gray-300" : "text-gray-700"} text-sm hover:underline`}
            >
              ← Volver a Iniciar Sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
