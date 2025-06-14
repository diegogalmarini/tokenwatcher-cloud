// src/app/(marketing)/whitepaper/page.tsx
"use client";

import React from 'react';
import Button from '@/components/ui/button';

export default function WhitepaperPage() {
  return (
    // CORREGIDO: dark:bg-[#262626]
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        {/* CORREGIDO: dark:bg-[#404040] */}
        <div className="bg-white dark:bg-[#404040] shadow-xl rounded-lg p-6 md:p-10">
          
          <section className="mb-8 border-b pb-6 border-gray-200 dark:border-gray-700">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Whitepaper: TokenWatcher-Cloud
            </h1>
            <div className="flex flex-wrap text-sm text-gray-600 dark:text-gray-400">
              <span className="mr-4"><strong>Author:</strong> Diego Raúl Galmarini</span>
              <span className="mr-4"><strong>Version:</strong> 7.0 (Revised)</span>
              <span><strong>Date:</strong> June 13, 2025</span>
            </div>
          </section>

          <div className="max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                1. Executive Summary
              </h2>
              <p>
                TokenWatcher-Cloud is a software platform designed for the real-time monitoring of significant ERC-20 token transfers on Ethereum Virtual Machine (EVM) compatible networks, such as Ethereum, Polygon, and Arbitrum. This project stems from direct experience with the difficulty of manually tracking relevant on-chain movements, aiming to create an accessible and efficient tool that allows developers, analysts, and Web3 enthusiasts to gain this visibility without incurring the complexity and costs associated with deploying and maintaining their own infrastructure.
              </p>
              <p>
                The platform operates as a service that polls the blockchain at regular intervals, detects transfer events exceeding user-defined thresholds, and sends instant notifications. Management is centralized in a unified dashboard where users can create and manage their "watchers." One of its key features is the "Smart Threshold," which suggests and validates alert thresholds based on real-time market data to ensure notifications are always significant.
              </p>
            </section>
            
            <section className="text-center mt-12 py-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  Dive Into the Technical Details
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-xl mx-auto">
                  Download the complete Whitepaper in PDF format to explore the architecture, data flow, code examples, and project roadmap.
                </p>
                <a href="/TokenWatcher-Cloud-Whitepaper-V7.0.pdf" download>
                    <Button intent="default" size="lg">Download Whitepaper (PDF)</Button>
                </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}