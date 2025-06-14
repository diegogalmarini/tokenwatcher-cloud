// src/app/(marketing)/how-it-works/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import HowItWorksSection from "@/components/home/HowItWorksSection";
import Button from "@/components/ui/button";

const detailedSteps = [
  {
    title: "1. Sign Up in Seconds",
    description: "Create your account using an email and password. The process is fast, secure, and gives you immediate access to your personal dashboard. We don't ask for unnecessary information.",
  },
  {
    title: "2. Create Your First 'Watcher'",
    description: "A 'Watcher' is a monitoring rule. You just need to give it a name, paste the contract address of the ERC-20 token you want to watch, and define the value threshold you consider significant (e.g., 100,000 USDC).",
  },
  {
    title: "3. Connect Your Alert Channel",
    description: "Paste the webhook URL for your preferred channel. We have native integration with Slack and Discord. Simply follow their instructions to generate a webhook URL and add it to your watcher.",
  },
  {
    title: "4. Receive Real-Time Alerts",
    description: "That's it! Our system will monitor the blockchain 24/7 for you. As soon as a transfer exceeds your defined threshold, we'll send a detailed, instant notification directly to your channel.",
  },
];

export default function HowItWorksPage() {
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow">
        <section className={`py-20 text-center ${isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8] text-gray-900"}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              From Complexity to Clarity
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Monitoring the blockchain has never been easier. Follow these four simple steps to start receiving valuable alerts.
            </p>
          </div>
        </section>

        <HowItWorksSection />

        <section className={`py-20 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h2 className={`text-3xl font-bold text-center mb-12 ${isDark ? "text-white" : "text-gray-900"}`}>
              A Closer Look
            </h2>
            <div className="space-y-8">
              {detailedSteps.map((step) => (
                <div key={step.title} className={`p-6 rounded-lg ${isDark ? "bg-neutral-800" : "bg-white"}`}>
                  <h3 className={`text-2xl font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>{step.title}</h3>
                  <p className={`text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`pt-10 pb-20 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Your Opportunity is Now
            </h2>
             <Link href="/register" legacyBehavior>
                <Button
                    intent="default"
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    Create My First Watcher
                </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}