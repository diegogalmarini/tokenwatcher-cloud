// File: src/components/home/HowItWorksSection.tsx
"use client";

import React from "react";
import { useTheme } from "next-themes";

export default function HowItWorksSection() {
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  return (
    <section className={`py-16 ${isDark ? "bg-[#262626]" : "bg-[#e8e8e8]"}`}>
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8 dark:text-white">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Paso 1 */}
          <div className="flex flex-col items-center">
            <div className="bg-white dark:bg-neutral-700 p-4 rounded-full mb-4 shadow-lg">
              {/* … icono … */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-neutral-600 dark:text-neutral-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A4 4 0 017 16h10a4 4 0 011.879.804M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 2v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-1m14-6h2a2 2 0 012 2v1m-4-3V4a2 2 0 00-2-2H8a2 2 0 00-2 2v7m6 4v4m0-4l-2-2m2 2l2-2"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Sign Up
            </h4>
            <p className="text-gray-600 dark:text-gray-200">
              Create your account in seconds.
            </p>
          </div>
          {/* Paso 2 */}
          <div className="flex flex-col items-center">
            <div className="bg-white dark:bg-neutral-700 p-4 rounded-full mb-4 shadow-lg">
              {/* … icono … */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-neutral-600 dark:text-neutral-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m-1-4h4v2H9a2 2 0 00-2 2v5h6v-1m-4 1h4m-4 0a2 2 0 01-2-2v-1h6v-1m0 2v-1"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Create a Watcher
            </h4>
            <p className="text-gray-600 dark:text-gray-200">
              Enter token address & threshold.
            </p>
          </div>
          {/* Paso 3 */}
          <div className="flex flex-col items-center">
            <div className="bg-white dark:bg-neutral-700 p-4 rounded-full mb-4 shadow-lg">
              {/* … icono … */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-neutral-600 dark:text-neutral-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17a4 4 0 100-8 4 4 0 000 8zm10 0v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1m14-6h2a2 2 0 012 2v1m-4-3V4a2 2 0 00-2-2H8a2 2 0 00-2 2v7m6 4v4m0-4l-2-2m2 2l2-2"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Choose Webhook
            </h4>
            <p className="text-gray-600 dark:text-gray-200">
              Connect Slack, Discord, or Telegram.
            </p>
          </div>
          {/* Paso 4 */}
          <div className="flex flex-col items-center">
            <div className="bg-white dark:bg-neutral-700 p-4 rounded-full mb-4 shadow-lg">
              {/* … icono … */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-neutral-600 dark:text-neutral-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m0 0l-4.553 2.276A1 1 0 009 14.618V7.854a1 1 0 011.447-.894L15 10zm0 0V4m0 10v6"
                />
              </svg>
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">
              Get Notified
            </h4>
            <p className="text-gray-600 dark:text-gray-200">
              Receive instant alerts on large transfers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
