// dashboard/tokenwatcher-app/src/app/about/page.tsx
"use client";

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import Button from '@/components/ui/button';
// import type { Metadata } from 'next'; // Para Server Components

/*
// Si esta página fuera un Server Component, así definiríamos los metadatos:
export const metadata: Metadata = {
  title: 'About TokenWatcher - Real-Time Blockchain Event Monitoring',
  description: 'Learn what TokenWatcher is, the problems it solves, and how it provides simplified on-chain visibility with real-time ERC-20 token alerts.',
  // openGraph: { images: ['/og-image.png'] } // Asegúrate que og-image.png esté en public/
};
*/

export default function AboutPage() {
  // Para Client Components, el título se puede manejar con useEffect si es necesario,
  // o a través del layout si es estático.
  // useEffect(() => { document.title = "About TokenWatcher"; }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-10">
          
          {/* Section 1: What is TokenWatcher? */}
          <section className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Understanding TokenWatcher
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
              Your essential tool for simplified, real-time ERC-20 event monitoring across
              leading EVM networks.
            </p>
          </section>

          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                What Exactly Is TokenWatcher?
              </h2>
              <p>
                TokenWatcher is a Software as a Service (SaaS) platform meticulously designed for the real-time
                monitoring of significant ERC-20 token transfers. We operate across key EVM-compatible
                networks including Ethereum, Polygon, and Arbitrum[cite: 1]. Our core mission is to offer an
                accessible and highly efficient tool that provides users with clear on-chain visibility,
                eliminating the complexities and costs typically associated with deploying and
                maintaining proprietary monitoring infrastructure[cite: 1, 2].
              </p>
              <p>
                Think of TokenWatcher as your "plug-and-play" solution for critical on-chain event alerts[cite: 1, 3].
                We empower a diverse range of Web3 participants—including developers, blockchain analysts,
                traders, and Decentralized Autonomous Organizations (DAOs)—to stay acutely informed
                and responsive in today's fast-paced digital asset market[cite: 1, 5, 7].
              </p>
            </section>

            {/* Section 2: The Challenge */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                The Challenge: Navigating the On-Chain Data Deluge
              </h2>
              <p>
                The blockchain ecosystem is characterized by an immense daily volume of transactions,
                rendering the manual detection of relevant, time-sensitive on-chain events a near-impossible
                task[cite: 1, 4]. Many active participants, such as traders and DAOs, find themselves unable to
                effectively surveil chain activity on their own[cite: 1, 6].
              </p>
              <p>
                This environment often leads to critical issues:
              </p>
              <ul className="list-disc list-outside space-y-2 pl-5">
                <li>
                  <strong>Information Overload:</strong> The sheer quantity of data makes it difficult to
                  pinpoint meaningful events. [cite: 1, 5]
                </li>
                <li>
                  <strong>Need for Immediacy:</strong> In a rapidly fluctuating market, delayed information
                  can result in missed opportunities or unmitigated risks. [cite: 1, 5]
                </li>
                <li>
                  <strong>Technical Complexity & Cost:</strong> Building and maintaining bespoke monitoring
                  solutions requires significant technical expertise and financial investment,
                  often beyond the reach of individual users or smaller teams. [cite: 1, 2, 5]
                </li>
                <li>
                  <strong>API Limitations:</strong> Reliance on public data APIs often comes with restrictive
                  rate limits or incomplete data, hindering comprehensive analysis. [cite: 1, 5]
                </li>
              </ul>
            </section>

            {/* Placeholder for "Our Solution: How TokenWatcher Works" */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Our Solution: How TokenWatcher Works (Content Coming Soon)
              </h2>
              <p>
                [Detailed explanation of the user flow: Sign Up -> Define Watcher (Token, Network, Threshold) -> Configure Webhook -> Receive Alerts -> View on Dashboard. Highlight key benefits like ease of use, multi-channel notifications.]
              </p>
            </section>

            {/* Placeholder for "The 'Why' / Our Mission" */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-3">
                The Vision Behind TokenWatcher (Content Coming Soon)
              </h2>
              <p>
                [Your story, the motivation for building TokenWatcher, commitment to the Web3 community, future vision, etc.]
              </p>
            </section>

            {/* Call to Action Section */}
            <section className="text-center mt-12 py-8">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Ready to Gain On-Chain Clarity?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6 max-w-xl mx-auto">
                Join TokenWatcher today with our free tier and start monitoring the token
                movements that matter to you.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/register" legacyBehavior>
                  <Button intent="default" size="lg" className="w-full sm:w-auto">Get Started for Free</Button>
                </Link>
                <a href="/whitepaper.pdf" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                  <Button intent="secondary" size="lg" className="w-full">Read Whitepaper</Button>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}