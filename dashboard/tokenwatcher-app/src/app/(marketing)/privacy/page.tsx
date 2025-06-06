// dashboard/tokenwatcher-app/src/app/privacy/page.tsx
"use client";

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20 md:mt-24">
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
            Privacy Policy
          </h1>
          <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 space-y-6">
            <p>
              <em>Last updated: June 01, 2025</em> {/* POR FAVOR, ACTUALIZA ESTA FECHA */}
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-2">Introduction</h2>
            <p>
              Welcome to TokenWatcher ("us", "we", or "our"). We are committed to protecting your
              personal information and your right to privacy. If you have any questions or
              concerns about this privacy notice, or our practices with regards to your
              personal information, please contact us at support@tokenwatcher.app. {/* ACTUALIZADO */}
            </p>
            <p>
              This privacy notice describes how we might use your information if you:
            </p>
            <ul>
              <li>Visit our website at http://tu.de/</li>
              <li>Register for an account and use our services</li>
              <li>Engage with us in other related ways, including any sales, marketing, or events</li>
            </ul>
            <p>
              By using our Service, you agree to the collection and use of information in
              accordance with this policy.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Information We Collect</h2>
            <p>
              We collect personal information that you voluntarily provide to us when you
              register on the Service, express an interest in obtaining information about us
              or our products and services, when you participate in activities on the
              Service or otherwise when you contact us.
            </p>
            <p>
              The personal information that we collect depends on the context of your
              interactions with us and the Service, the choices you make and the products
              and features you use. The personal information we collect may include the
              following: Email Address, Password (stored hashed).
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-2">How We Use Your Information</h2>
            <p>TokenWatcher uses the collected data for various purposes:</p>
            <ul>
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information so that we can improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2">Will Your Information Be Shared With Anyone?</h2>
            <p>
              We only share information with your consent, to comply with laws, to provide you
              with services, to protect your rights, or to fulfill business obligations.
              [Placeholder - Detail if you use third-party services for notifications, analytics, etc., and how you share data with them].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">How Long Do We Keep Your Information?</h2>
            <p>
              We keep your information for as long as necessary to fulfill the purposes
              outlined in this privacy notice unless otherwise required by law.
              [Placeholder - Be more specific about your retention policies].
            </p>
            
            <h2 className="text-xl font-semibold mt-6 mb-2">Do We Use Cookies and Other Tracking Technologies?</h2>
            <p>
              We may use cookies and similar tracking technologies to access or store
              information. [Placeholder - Detail your cookie usage, if applicable. For simple login, JWT system might use session cookies].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">What Are Your Privacy Rights?</h2>
            <p>
              In some regions, you have certain rights under applicable data protection
              laws. These may include the right (i) to request access and obtain a copy
              of your personal information, (ii) to request rectification or erasure;
              (iii) to restrict the processing of your personal information; and (iv)
              if applicable, to data portability. [Placeholder - Adapt this to your jurisdiction and provide a method to exercise these rights].
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy notice from time to time. The updated version
              will be indicated by an updated "Last updated" date and the updated version
              will be effective as soon as it is accessible.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Contact Us</h2>
            <p>
              If you have questions or comments about this notice, you may email us at
              support@tokenwatcher.app. {/* ACTUALIZADO */}
            </p>
            <p className="mt-8 text-center font-semibold">
              IMPORTANT: This is a basic placeholder and not a complete Privacy Policy.
              You MUST replace this with a comprehensive policy suitable for your specific service,
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