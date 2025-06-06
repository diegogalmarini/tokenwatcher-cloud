// File: src/components/home/HeroSection.tsx
"use client";

import React from "react";
import Link from "next/link";

interface HeroSectionProps {
  isDark: boolean;
  toggleDark: () => void;
}

export default function HeroSection({ isDark, toggleDark }: HeroSectionProps) {
  return (
    <section
      className={`w-full ${
        isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8]"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center px-6 py-20 lg:py-32">
        {/* TEXTO A LA IZQUIERDA */}
        <div className="flex-1 lg:pr-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Real-Time ERC-20 Event Monitoring, Simplified.
          </h1>
          <p className={`text-lg md:text-xl mb-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Gain immediate on-chain visibility. Receive instant, configurable alerts for significant
            ERC-20 token transfers on Ethereum, Polygon, and Arbitrum—no complex infrastructure
            required.
          </p>
          {/* ENLACE “Get Started for Free” */}
          <Link
            href="/register"
            className={`inline-block px-8 py-4 rounded-lg font-semibold text-lg transition ${
              isDark
                ? "bg-white text-gray-900 hover:bg-gray-200"
                : "bg-black text-white hover:bg-[#4a4a4a]"
            }`}
          >
            Get Started for Free
          </Link>
        </div>

        {/* IMAGEN A LA DERECHA */}
        <div className="flex-1 mt-12 lg:mt-0 lg:pl-12 w-full flex justify-center">
          <img
            src="/dashboard-screenshot.png"
            alt="TokenWatcher Dashboard Preview"
            className="w-full max-w-md lg:max-w-lg rounded-lg shadow-xl"
          />
        </div>
      </div>
    </section>
  );
}
