// src/app/(marketing)/privacy/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    // CORREGIDO: dark:bg-[#262626]
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        {/* CORREGIDO: dark:bg-[#404040] */}
        <div className="bg-white dark:bg-[#404040] shadow-xl rounded-lg p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Privacy Policy
          </h1>
          <div className="max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <em>Last updated: June 14, 2025</em>
            </p>
            
            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Introduction</h2>
            <p>
              Welcome to TokenWatcher ("us", "we", or "our"). We are committed to protecting your
              personal information and your right to privacy. This privacy notice describes how we collect, use, disclose, and safeguard your information when you visit our website https://tokenwatcher.app and use our services (the "Services").
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you register for the Services. The personal information we collect includes your Email Address and a Password, which is always stored in a hashed, non-reversible format. We do not collect any other personal identifiable information unless you provide it to us directly, for example, by contacting customer support.
            </p>
            
            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">How We Use Your Information</h2>
            <p>We use the information we collect or receive to:</p>
            <ul className="list-disc list-inside pl-4 space-y-1">
              <li>Facilitate account creation and the logon process.</li>
              <li>Send administrative information to you, such as changes to our terms, conditions, and policies.</li>
              <li>Provide and maintain our Services, including monitoring usage to detect and address technical issues.</li>
              <li>Protect our Services and keep them safe and secure (for example, for fraud monitoring).</li>
            </ul>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Will Your Information Be Shared With Anyone?</h2>
            <p>
              We do not share, sell, rent, or trade your personal information with third parties for their promotional purposes. We may share information with third-party vendors and service providers who perform services for us (such as email delivery for password resets and notifications) and require access to such information to do that work.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">How Long Do We Keep Your Information?</h2>
            <p>
              We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy notice, unless a longer retention period is required or permitted by law. When you delete your account, we will take reasonable steps to delete your personal information from our active systems.
            </p>
            
            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Do We Use Cookies?</h2>
            <p>
             Yes. We use essential cookies to manage user sessions and authentication after you log in. These cookies are necessary for the Service to function and do not store any personally identifiable information. We do not use cookies for tracking or advertising purposes.
            </p>

            <h2 className="text-2xl font-semibold mt-6 mb-2 border-t pt-6 border-gray-200 dark:border-gray-700">Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may visit our{' '}
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