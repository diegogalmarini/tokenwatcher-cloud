// dashboard/tokenwatcher-app/src/app/terms/page.tsx
"use client";

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function TermsOfServicePage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Terms of Service
          </h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p>
              <em>Last updated: June 01, 2025</em> {/* POR FAVOR, ACTUALIZA ESTA FECHA */}
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you
              disagree with any part of the terms then you may not access the Service.
              These Terms apply to all visitors, users and others who wish to access or
              use the Service.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">2. Accounts</h2>
            <p>
              When you create an account with us, you guarantee that you are above the age
              of 18, and that the information you provide us is accurate, complete, and
              current at all times. Inaccurate, incomplete, or obsolete information may
              result in the immediate termination of your account on our Service. You are
              responsible for maintaining the confidentiality of your account and password...
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">3. Service Usage</h2>
            <p>
              You agree not to use the service for any illegal or unauthorized purpose.
              You agree to comply with all laws, rules, and regulations applicable to your
              use of the Service. We reserve the right to terminate or suspend your account
              if any misuse is detected. [Placeholder - Define acceptable and unacceptable use].
            </p>
            <p>
              Our free tier supports up to 5 watchers. Usage beyond these limits may require a custom plan or may result in service limitations.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">4. Intellectual Property</h2>
            <p>
              The Service and its original content, features and functionality are and will
              remain the exclusive property of TokenWatcher (or Diego Galmarini) and its licensors.
              [Placeholder - Adapt this].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">5. Limitation Of Liability</h2>
            <p>
              In no event shall TokenWatcher, nor its directors, employees, partners, agents,
              suppliers, or affiliates, be liable for any indirect, incidental, special,
              consequential or punitive damages... [Placeholder - THIS SECTION IS VERY LEGALLY IMPORTANT].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">6. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an
              "AS IS" and "AS AVAILABLE" basis. The Service is provided without
              warranties of any kind, whether express or implied... [Placeholder - THIS SECTION IS VERY LEGALLY IMPORTANT].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">7. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these
              Terms at any time. If a revision is material we will provide at least 30
              days' notice prior to any new terms taking effect.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at
              support@tokenwatcher.app. {/* ACTUALIZADO */}
            </p>
            <p className="mt-8 text-center font-semibold">
              IMPORTANT: This is a basic placeholder and not a complete Terms of Service.
              You MUST replace this with comprehensive terms suitable for your specific service,
              data handling practices, and legal jurisdiction. Consider using a reputable
              template or consulting with a legal professional.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}