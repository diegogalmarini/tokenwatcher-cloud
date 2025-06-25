// src/app/(marketing)/how-it-works/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import DocsNav from '@/components/layout/DocsNav'; // Navegación lateral del manual

/* ---------------------------------------------------------------------------
   TokenWatcher – Manual de Usuario (versión sin secciones de administrador)
   --------------------------------------------------------------------------- */

// Contenido de cada capítulo (sin el antiguo Capítulo 7 de panel de admin).
const sections = [
  /* ------------------------ CAPÍTULO 1 ------------------------ */
  {
    id: 'chapter-1',
    title: '1. Introduction',
    level: 1,
    content: (
      <>
        {/* 1.1 */}
        <h3 className="text-2xl font-semibold mb-3">1.1 What is TokenWatcher?</h3>
        <p>In the volatile and fast‑paced world of cryptocurrency, information is your most valuable asset. The ability to access and act on relevant data faster than the rest of the market provides a critical, competitive edge. However, tracking significant on‑chain events manually is overwhelming. Public block explorers stream thousands of transactions every minute, making it nearly impossible to distinguish market‑moving transfers from insignificant noise.</p>
        <p className="mt-4">TokenWatcher is engineered to cut through this noise and deliver actionable intelligence directly to you. With TokenWatcher, you stop reacting to the market and start anticipating it.</p>

        {/* 1.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">1.2 Who Is This For?</h3>
        <ul className="list-disc list-inside space-y-3">
          <li><b>For the Active Trader:</b> Track whale wallets, get instant alerts on influential player movements, front‑run market‑moving news like exchange deposits, and identify unusual activity that could signal a shift in market sentiment.</li>
          <li><b>For the Long‑Term Investor:</b> Monitor the health of your portfolio by tracking project treasuries for signs of development funding or team sales, and anticipate supply changes from token unlocks or VC wallet movements.</li>
          <li><b>For Project Teams:</b> Enhance community transparency by monitoring your own token's on‑chain activity, understand token distribution among your holders, and detect market anomalies or potential manipulation that could require a public response.</li>
        </ul>

        {/* 1.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">1.3 Key Features at a Glance</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><b>Customizable Watchers:</b> Create highly specific monitors for any ERC‑20 token on our supported networks.</li>
          <li><b>USD‑Based Value Thresholds:</b> Set alerts based on a simple, real‑world metric: the transaction's value in US Dollars.</li>
          <li><b>Smart Threshold Suggestions:</b> Our system analyzes a token's recent 24‑hour trading volume to suggest a meaningful threshold, helping you create effective, low‑noise alerts from the start.</li>
          <li><b>Multi‑Channel Notifications:</b> Seamless, real‑time integration with Email, Discord, Slack, and Telegram.</li>
          <li><b>Detailed & Filterable Event History:</b> Every alert is logged in your personal, searchable on‑chain intelligence database for historical analysis.</li>
        </ul>

        {/* 1.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">1.4 Supported Blockchains</h3>
        <p>TokenWatcher currently focuses on the most active EVM‑compatible networks: Ethereum, Polygon, and Arbitrum. Our engineering team is constantly working to integrate new, high‑demand blockchains.</p>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 2 ------------------------ */
  {
    id: 'chapter-2',
    title: '2. Account & Security',
    level: 1,
    content: (
      <>
        <p>Your TokenWatcher account is your secure gateway to all platform features. This chapter covers creating, securing, and managing your account to ensure a smooth, safe experience.</p>

        {/* 2.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.1 Creating Your Account</h3>
        <p>Sign up with a valid email address and a strong password (≥ 8 chars, upper‑ & lowercase, number, special character).</p>

        {/* 2.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.2 Email Verification</h3>
        <p>Check your inbox for our verification link. You must click it to activate your account and enable notifications.</p>

        {/* 2.3‑2.6 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.3 Logging In, Password Resets & More</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><b>Session Management:</b> Sessions expire after periods of inactivity for security.</li>
          <li><b>Forgot Password:</b> Use the “Forgot Password?” link. Reset links expire after 15 minutes.</li>
          <li><b>Change Password:</b> Update anytime from “Settings”.</li>
          <li><b>Danger Zone – Delete Account:</b> Irreversible action that erases your profile, Watchers, notifications, and event history.</li>
        </ul>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 3 ------------------------ */
  {
    id: 'chapter-3',
    title: '3. The Dashboard',
    level: 1,
    content: (
      <>
        <p>The Dashboard is your primary workspace, giving an instant overview of all monitoring activity.</p>

        {/* 3.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.1 Navigating the Dashboard</h3>
        <p>The top navigation menu links to: <b>Dashboard</b>, <b>Events</b>, <b>Billing</b>, and <b>Settings</b>.</p>

        {/* 3.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.2 The Watcher List</h3>
        <p>A real‑time table showing every Watcher you have created. Columns include Token, Token Address, Threshold (USD), Notification Target, and Status.</p>

        {/* 3.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.3 Quick Actions</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><b>Edit:</b> Adjust any Watcher setting.</li>
          <li><b>Pause / Activate:</b> Temporarily disable or re‑enable monitoring.</li>
          <li><b>Test:</b> Send a sample notification to verify your channel.</li>
          <li><b>Delete:</b> Permanently remove a Watcher and its event history (irreversible).</li>
        </ul>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 4 ------------------------ */
  {
    id: 'chapter-4',
    title: '4. Mastering Watchers',
    level: 1,
    content: (
      <>
        <p>A Watcher is your personal on‑chain scout, running 24/7.</p>

        {/* 4.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.1 What is a "Watcher"?</h3>
        <p>Define a token contract and a USD threshold. When a transaction meets the rule, TokenWatcher logs an Event and sends a notification.</p>

        {/* 4.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.2 Creating a New Watcher</h3>
        <ul className="list-disc list-inside space-y-3 mt-2">
          <li><b>Name:</b> Use descriptive labels (e.g., “Whale Movements – LINK”).</li>
          <li><b>Find the Contract Address:</b> Copy from a trusted source like Etherscan or CoinGecko.</li>
          <li><b>Set the Threshold:</b> Enter a manual USD value or use Smart Threshold Suggestion based on recent 24h volume.</li>
        </ul>

        {/* 4.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.3 Configuring Notifications</h3>
        <ul className="list-disc list-inside space-y-3 mt-2">
          <li><b>Email:</b> Sent to your registered address.</li>
          <li><b>Discord & Slack:</b> Paste an Incoming Webhook URL.</li>
          <li><b>Telegram:</b> Provide a JSON with <code>{"bot_token":"…","chat_id":"…"}</code>.</li>
        </ul>
        <p className="mt-4 font-bold">Always hit “Test” before saving to confirm delivery.</p>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 5 ------------------------ */
  {
    id: 'chapter-5',
    title: '5. The Events Feed',
    level: 1,
    content: (
      <>
        <p>Your searchable history of every significant transaction detected by your Watchers.</p>

        {/* 5.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.1 Understanding the Events Table</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><b>Watcher:</b> Name of the Watcher that triggered the alert.</li>
          <li><b>From / To Address:</b> Wallets involved.</li>
          <li><b>Amount / USD Value:</b> Token quantity and dollar value at trigger time.</li>
          <li><b>Tx Hash:</b> Clickable link to a block explorer.</li>
        </ul>

        {/* 5.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.2 Powerful Filtering</h3>
        <p>Filter by Watcher, Token, Address, Value or Date to uncover patterns and trends.</p>

        {/* 5.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.3 Deep‑Dive Verification</h3>
        <p>Every Tx hash links directly to Etherscan (or equivalent) so you can verify data against the blockchain.</p>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 6 ------------------------ */
  {
    id: 'chapter-6',
    title: '6. Billing & Plans',
    level: 1,
    content: (
      <>
        <p>TokenWatcher scales with your needs through a simple tiered subscription (Free, Medium, Advanced).</p>

        {/* 6.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.1 How Our Plans Work</h3>
        <p>Your plan’s <b>watcher_limit</b> defines how many Watchers you can run. Paused Watchers still count towards the limit.</p>

        {/* 6.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.2 Viewing Your Usage</h3>
        <p>The Billing page shows your current plan, status, and real‑time Watcher usage (e.g., “3 / 5”).</p>

        {/* 6.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.3 Upgrading or Downgrading</h3>
        <p>Change plans any time from Billing. Your new watcher_limit applies instantly.</p>

        {/* 6.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.4 Coming Soon: Stripe Payments</h3>
        <p>Automated, secure billing via Stripe is on our roadmap.</p>
      </>
    )
  },

  /* ------------------------ CAPÍTULO 7 ------------------------ */
  {
    id: 'chapter-7',
    title: '7. Troubleshooting & FAQ',
    level: 1,
    content: (
      <>
        <p>Answers to common questions and a step‑by‑step diagnostic checklist.</p>

        {/* 7.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.1 I’m not receiving alerts</h3>
        <ol className="list-decimal list-inside space-y-2 mt-2">
          <li><b>Test:</b> Use the Test button on the Watcher.</li>
          <li><b>Verify Notification Target:</b> Check email/webhook details.</li>
          <li><b>Watcher Status:</b> Ensure it’s Active.</li>
          <li><b>Threshold:</b> Consider lowering if no events meet it.</li>
          <li><b>Email Spam:</b> Whitelist no-reply@tokenwatcher.app.</li>
        </ol>

        {/* 7.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.2 Smart Threshold seems off</h3>
        <p>The suggestion is a percentage of 24h volume. High‑cap tokens ⇒ high thresholds; low‑cap tokens ⇒ low thresholds. Adjust to taste.</p>

        {/* 7.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.3 Finding My Discord / Slack Webhook URL</h3>
        <p>Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy URL.<br/>Slack: Workspace Settings → Manage Apps → “Incoming Webhooks” → Add → choose channel → Copy URL.</p>

        {/* 7.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.4 Telegram Bot Token & Chat ID</h3>
        <p>Use @BotFather to create a bot and @userinfobot to get your Chat ID, then paste as <code>{"bot_token":"…","chat_id":"…"}</code>.</p>
      </>
    )
  }
];

export default function HowItWorksPage() {
  const { theme, systemTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>('chapter-1');
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  /* ----------------------- Scroll Spy ----------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const currentRefs = sectionRefs.current;
    Object.values(currentRefs).forEach((ref) => ref && observer.observe(ref));

    return () => {
      Object.values(currentRefs).forEach((ref) => ref && observer.unobserve(ref));
    };
  }, []);

  /* --------------------- Render Page ----------------------- */
  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-neutral-900' : 'bg-white'}`}>
      <main className="flex-grow">
        {/* Hero */}
        <section className={`py-16 md:py-20 text-center border-b ${isDark ? 'border-neutral-800 bg-neutral-900' : 'border-gray-200 bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white">
              The Complete TokenWatcher Manual
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Everything you need to master on‑chain intelligence – no admin‑only fluff.
            </p>
          </div>
        </section>

        {/* Main Content + Side Nav */}
        <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] lg:gap-12">
            {/* Article */}
            <article className="prose prose-lg dark:prose-invert max-w-none">
              {sections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="mb-16 scroll-mt-20"
                >
                  <h2 className="text-3xl font-bold border-b pb-2 mb-6 dark:border-neutral-700">
                    {section.title}
                  </h2>
                  <div className="text-gray-700 dark:text-gray-300 space-y-4">
                    {section.content}
                  </div>
                </section>
              ))}
            </article>

            {/* Fixed Nav */}
            <aside className="hidden lg:block">
              <DocsNav sections={sections} activeSection={activeSection} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
