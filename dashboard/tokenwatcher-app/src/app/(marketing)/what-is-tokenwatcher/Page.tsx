// src/app/(marketing)/what-is-tokenwatcher/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import ProblemSolutionSection from "@/components/home/ProblemSolutionSection";
import UserBenefitsSection from "@/components/home/UserBenefitsSection";
import Button from "@/components/ui/button"; // Asegurarse de importar Button si se usa

export default function WhatIsTokenWatcherPage() {
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow">
        <section className={`py-20 text-center ${isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8] text-gray-900"}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              What is TokenWatcher?
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Your window into the on-chain ecosystem. We turn blockchain noise into clear, actionable signals so you never miss a critical move.
            </p>
          </div>
        </section>

        <ProblemSolutionSection />

        <UserBenefitsSection isDark={isDark} />

        <section className={`py-20 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Ready to Take Control?
            </h2>
            <p className={`text-lg md:text-xl mb-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Create your free account and set up your first watcher in less than two minutes.
            </p>
            <Link
              href="/register"
              legacyBehavior>
                <Button
                    intent="default"
                    size="lg"
                    className="w-full sm:w-auto"
                >
                    Get Started for Free
                </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}