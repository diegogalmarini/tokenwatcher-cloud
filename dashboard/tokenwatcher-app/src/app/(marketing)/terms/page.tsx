// src/app/(marketing)/terms/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    // CORREGIDO: dark:bg-[#262626]
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        {/* CORREGIDO: dark:bg-[#404040] */}
        <div className="bg-white dark:bg-[#404040] shadow-xl rounded-lg p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Terms of Service
          </h1>
          <div className="max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <em>Last updated: June 14, 2025</em>
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">1. Agreement to Terms</h2>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you
              disagree with any part of the terms then you may not access the Service.
              These Terms apply to all visitors, users and others who wish to access or
              use the Service.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">2. Accounts</h2>
            <p>
              When you create an account with us, you guarantee that you are above the age
              of 18, and that the information you provide us is accurate, complete, and
              current at all times. Inaccurate, incomplete, or obsolete information may
              result in the immediate termination of your account on our Service. You are
              responsible for maintaining the confidentiality of your account and password.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">3. Service Usage</h2>
            <p>
              You agree not to use the service for any illegal or unauthorized purpose.
              You agree to comply with all laws, rules, and regulations applicable to your
              use of the Service. We reserve the right to terminate or suspend your account
              if any misuse is detected, including creating an excessive number of watchers that compromises service stability.
            </p>
            <p>
              Our free tier supports up to 5 watchers. Usage beyond these limits may require a custom plan or may result in service limitations.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">4. Intellectual Property</h2>
            <p>
              The Service and its original content, features and functionality are and will
              remain the exclusive property of TokenWatcher and its licensors.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">5. Limitation Of Liability</h2>
            <p>
              In no event shall TokenWatcher, nor its directors, employees, partners, agents,
              suppliers, or affiliates, be liable for any indirect, incidental, special,
              consequential or punitive damages. Your use of the Service is at your sole risk and you acknowledge that data provided may not always be accurate or timely.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">6. Disclaimer</h2>
            <p>
              Your use of the Service is at your sole risk. The Service is provided on an
              "AS IS" and "AS AVAILABLE" basis. The Service is provided without
              warranties of any kind, whether express or implied.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">7. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these
              Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Contact Us</h2>
            <p>
              If you have any questions about these Terms, please visit our{' '}
              <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
                Contact Page
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}