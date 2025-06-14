// src/app/(marketing)/about/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Button from '@/components/ui/button';

export default function AboutPage() {
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow">
        
        {/* === Title Section === */}
        <section className={`py-20 text-center ${isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8] text-gray-900"}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              About TokenWatcher
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Our mission is to bring clarity and accessibility to on-chain data monitoring for everyone in the Web3 space.
            </p>
          </div>
        </section>

        {/* === The Vision Section === */}
        <section className={`py-20 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <h2 className={`text-3xl font-bold text-center mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>
              The Vision Behind TokenWatcher
            </h2>
            <p className={`text-lg text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              TokenWatcher was born from direct, firsthand experience with the frustrations of manually tracking significant on-chain movements. As a developer immersed in Web3, the task of sifting through block explorers was tedious, error-prone, and simply not scalable. This personal pain point sparked the mission to build an automated, efficient, and accessible solution for everyone in the space.
            </p>
            <p className={`text-lg text-center ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              This project is more than just a utility; it's a practical demonstration of applying modern software engineering and cloud architecture principles to solve a tangible problem in the Web3 ecosystem. By making the source code available, we aim to foster learning, transparency, and community collaboration.
            </p>
          </div>
        </section>
        
        {/* === The Challenge Section === */}
        <section className={`py-20 ${isDark ? "bg-[#262626]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-3xl mx-auto px-6">
            <h2 className={`text-3xl font-bold text-center mb-8 ${isDark ? "text-white" : "text-gray-900"}`}>
              The Challenge We Solve
            </h2>
            <p className={`text-lg text-center mb-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              The blockchain ecosystem is characterized by an immense daily volume of transactions, making manual detection of relevant events nearly impossible. This leads to critical issues for active participants:
            </p>
            <ul className={`space-y-4 text-lg ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              <li className="flex items-start p-4 rounded-lg bg-white dark:bg-neutral-700">
                <span className="text-blue-500 font-bold mr-3 mt-1">✓</span>
                <div><strong>Information Overload:</strong> Difficulty in filtering out the noise to find the signal.</div>
              </li>
              <li className="flex items-start p-4 rounded-lg bg-white dark:bg-neutral-700">
                <span className="text-blue-500 font-bold mr-3 mt-1">✓</span>
                <div><strong>Need for Immediacy:</strong> In a volatile market, delayed information means missed opportunities.</div>
              </li>
              <li className="flex items-start p-4 rounded-lg bg-white dark:bg-neutral-700">
                <span className="text-blue-500 font-bold mr-3 mt-1">✓</span>
                <div><strong>Technical & Cost Barriers:</strong> Building and maintaining bespoke monitoring solutions is complex and expensive.</div>
              </li>
            </ul>
          </div>
        </section>

        {/* === Call to Action (CTA) Section === */}
        <section className={`py-20 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className={`text-3xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
              Ready to Gain On-Chain Clarity?
            </h2>
            <p className={`text-lg md:text-xl mb-8 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Join TokenWatcher today with our free tier and start monitoring the token movements that matter to you.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href="/register" legacyBehavior>
                <Button intent="default" size="lg" className="w-full sm:w-auto">Get Started for Free</Button>
              </Link>
              <Link href="/whitepaper" legacyBehavior>
                <Button intent="secondary" size="lg" className="w-full sm:w-auto">Read the Whitepaper</Button>
              </Link>
            </div>
          </div>
        </section>
        
      </main>
    </div>
  );
}