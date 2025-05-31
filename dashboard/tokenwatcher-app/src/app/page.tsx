// File: src/app/page.tsx
"use client";

import React, { useEffect } from "react";
import HeroSection from "@/components/home/HeroSection";
import FAQSection from "@/components/home/FAQSection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  // Escuchamos el CustomEvent para abrir el modal de registro desde HeroSection
  useEffect(() => {
    function openRegisterListener() {
      const btn = document.querySelector<HTMLButtonElement>(
        "button[aria-label='open-register']"
      );
      btn?.click();
    }
    window.addEventListener("open-register-modal", openRegisterListener);
    return () => {
      window.removeEventListener("open-register-modal", openRegisterListener);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <HeroSection />
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold mb-4">
              Why TokenWatcher?
            </h2>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              Monitoring large token transfers manually is slow and
              error-prone. Traditional solutions rely on expensive data
              feeds or require you to maintain your own node.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              TokenWatcher solves this by providing an easy, plug-and-play
              service: simply specify which ERC-20 contract to watch and
              what volume matters to you. Instantly get notified to Slack,
              Discord, or Telegram—no devops required.
            </p>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-12">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Instant Alerts
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Configure custom thresholds and receive notifications the
                  moment a transfer exceeds your limit.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Multi-Chain Support
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Ethereum, Polygon, Arbitrum—and more chains coming soon.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Flexible Webhooks
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Send alerts to Slack, Discord, Telegram, or any custom
                  webhook endpoint.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Zero Infrastructure
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  No nodes, no servers—everything runs “in the cloud” and is
                  maintenance-free.
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold mb-2">
                  Secure & Reliable
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Built on FastAPI and PostgreSQL, with event partitioning for
                  infinite scale.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-blue-600 dark:text-blue-300"
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
                <h4 className="font-semibold mb-2">Sign Up</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Create your account in seconds.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-blue-600 dark:text-blue-300"
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
                <h4 className="font-semibold mb-2">Create a Watcher</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Enter token address & threshold.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-blue-600 dark:text-blue-300"
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
                <h4 className="font-semibold mb-2">Choose Webhook</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Connect Slack, Discord, or Telegram.
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-full mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-blue-600 dark:text-blue-300"
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
                <h4 className="font-semibold mb-2">Get Notified</h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Receive instant alerts on large transfers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <FAQSection />
      </main>

      <Footer />
    </div>
  );
}
