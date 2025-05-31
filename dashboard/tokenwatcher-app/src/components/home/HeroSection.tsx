// Archivo: src/components/home/HeroSection.tsx

"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="px-6 py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center">
        {/* Columna de texto */}
        <div className="lg:w-1/2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-gray-900 dark:text-gray-100">
            Real-Time ERC-20 Event Monitoring, Simplified.
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            Gain immediate on-chain visibility. Receive instant, configurable alerts
            for significant ERC-20 token transfers on Ethereum, Polygon, and Arbitrum—no
            complex infrastructure required.
          </p>
          <Link href="/register" legacyBehavior>
            <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition">
              Get Started for Free
            </a>
          </Link>
        </div>

        {/* Columna de imagen (usa next/image para optimizar) */}
        <div className="lg:w-1/2 mt-8 lg:mt-0 relative w-full h-[500px] sm:h-[400px] md:h-[450px] lg:h-[500px]">
          <Image
            src="/hero-placeholder.png"    // apunta a public/hero-placeholder.png
            alt="Product Demo"
            fill                            // llena todo el contenedor <div>
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
            className="object-cover rounded-lg shadow-lg"
            priority                        // carga de alta prioridad en la Home
          />
        </div>
      </div>
    </section>
  );
}
