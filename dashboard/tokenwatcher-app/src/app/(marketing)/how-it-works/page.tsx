// src/app/(marketing)/how-it-works/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import DocsNav from "@/components/layout/DocsNav";

/** ---------------------------------------------------------------------------
 *  TokenWatcher – Complete User Manual (PUBLIC EDITION)
 *  --------------------------------------------------------------------------
 *  This file is auto‑generated from the authoritative Word document provided
 *  by the product team. All admin‑only content has been removed so that regular
 *  end‑users only see what is relevant to them.
 *
 *  • Chapters 1‑7 are included verbatim (minor markdown → JSX adjustments).
 *  • Chapters relating to administrator tooling (previous Chapter 7 in DOC)
 *    have been stripped out.
 *  • Keeps parity with master documentation (25 Jun 2025).
 *
 *  NOTE: Each large content block is kept inside a React Fragment (<> … </>) to
 *  ensure JSX validity. Comments inside JSX use {/* … */} syntax.
 *  --------------------------------------------------------------------------*/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Section {
  id: string;
  title: string;
  level: number; // 1 = main chapter, 2+ = subsection
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Sections (Full text, admin content removed)
// ---------------------------------------------------------------------------
const sections: Section[] = [
  // -----------------------------------------------------------------------
  // CHAPTER 1: Introduction to TokenWatcher
  // -----------------------------------------------------------------------
  {
    id: "chapter-1",
    title: "1. Introduction",
    level: 1,
    content: (
      <>
        <h3 className="text-2xl font-semibold mb-3">1.1 What is TokenWatcher?</h3>
        <p>
          TokenWatcher is engineered to cut through the fire‑hose of raw blockchain
          data and surface <strong>actionable, value‑based alerts</strong> in real
          time. Instead of sifting through every transaction, you define simple
          rules (“Watchers”) and receive multi‑channel notifications the moment a
          transaction matches your criteria.
        </p>
        <p className="mt-4">
          By focusing on the <em>USD value</em> of transfers, TokenWatcher keeps
          your strategy consistent even as token prices fluctuate wildly.
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.2 Who Is This For?</h3>
        <ul className="list-disc list-inside space-y-3">
          <li>
            <strong>Active Traders –</strong> Front‑run exchange listings, track
            whale wallets and spot unusual inflows or outflows before the market
            reacts.
          </li>
          <li>
            <strong>Long‑Term Investors –</strong> Monitor project treasuries,
            vesting unlocks and VC wallets to anticipate supply shocks.
          </li>
          <li>
            <strong>Project Teams –</strong> Audit on‑chain activity for your own
            token, boost transparency and respond quickly to suspicious flows.
          </li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.3 Key Features at a Glance</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>Unlimited, highly&nbsp;customisable Watchers per supported plan.</li>
          <li>Thresholds expressed in <strong>USD</strong>, not token units.</li>
          <li>
            <i>Smart Threshold Suggestions</i> based on 24‑h trading volume for
            quick, noise‑free setup.
          </li>
          <li>Instant alerts via Email, Discord, Slack and Telegram.</li>
          <li>Full historical Events Feed with powerful filters.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.4 Supported Blockchains</h3>
        <p>
          TokenWatcher currently supports Ethereum, Polygon and Arbitrum. More
          EVM‑compatible chains will be added as demand grows.
        </p>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 2: Account & Security
  // -----------------------------------------------------------------------
  {
    id: "chapter-2",
    title: "2. Account & Security",
    level: 1,
    content: (
      <>
        <p>
          Your TokenWatcher account is the secure gateway to the platform. This
          chapter walks you through registration, verification and critical
          safety controls.
        </p>

        {/* 2.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.1 Creating Your Account</h3>
        <p>
          Sign‑up requires a valid email plus a strong password (≥ 8 chars,
          upper‑/lowercase, number &amp; symbol).
        </p>

        {/* 2.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.2 Email Verification</h3>
        <p>
          We send a one‑click verification link. Until clicked, notifications are
          disabled and you cannot access the dashboard.
        </p>

        {/* 2.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.3 Logging In &amp; Sessions</h3>
        <p>
          Sessions auto‑expire after inactivity. Always log out on shared
          devices.
        </p>

        {/* 2.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.4 Resetting a Forgotten Password</h3>
        <p>
          Use “Forgot Password?”. Reset links are single‑use and expire after
          15 minutes.
        </p>

        {/* 2.5 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.5 Changing Your Password</h3>
        <p>Change it anytime from Settings → Security (current password required).</p>

        {/* 2.6 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.6 The Danger Zone: Account Deletion</h3>
        <p className="font-bold">
          Deleting your account is permanent and erases your profile, Watchers
          and entire event history. This action <em>cannot</em> be undone.
        </p>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 3: The Dashboard
  // -----------------------------------------------------------------------
  {
    id: "chapter-3",
    title: "3. The Dashboard",
    level: 1,
    content: (
      <>
        <p>
          The Dashboard is your operational HQ, offering a real‑time overview of
          every Watcher plus quick links to Events, Billing and Settings.
        </p>

        {/* 3.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.1 Navigating the Dashboard</h3>
        <p>
          Top navigation: <code>Dashboard</code>, <code>Events</code>,
          <code> Billing</code>, <code>Settings</code>.
        </p>

        {/* 3.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.2 Watcher List</h3>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>TOKEN</strong> – Name &amp; symbol.</li>
          <li><strong>TOKEN ADDRESS</strong> – Contract address.</li>
          <li><strong>THRESHOLD (USD)</strong> – Trigger value.</li>
          <li><strong>NOTIFICATION TARGET</strong> – Email / Webhook.</li>
          <li><strong>STATUS</strong> – Active or Paused.</li>
        </ul>

        {/* 3.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">3.3 Quick Actions</h3>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>Edit –</strong> Open configuration modal.</li>
          <li><strong>Pause/Activate –</strong> Toggle monitoring.</li>
          <li><strong>Test –</strong> Send sample notification.</li>
          <li><strong>Delete –</strong> Remove Watcher + history.</li>
        </ul>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 4: Mastering Watchers
  // -----------------------------------------------------------------------
  {
    id: "chapter-4",
    title: "4. Mastering Watchers",
    level: 1,
    content: (
      <>
        <p>
          A Watcher is a persistent rule: <em>if transfer ≥ threshold USD</em>, log
          an Event and notify you.
        </p>

        {/* 4.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.1 What is a “Watcher”?</h3>
        <p>
          Each Watcher stores <strong>Token Address + USD Threshold</strong>. Once
          deployed it scans every new block, 24 / 7.
        </p>

        {/* 4.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.2 Creating a New Watcher</h3>
        <ul className="list-disc list-inside space-y-3 mt-4">
          <li><strong>Name –</strong> e.g. “Whale Movements – LINK”.</li>
          <li>
            <strong>Token Address –</strong> Copy from a trusted source like
            Etherscan or CoinGecko.
          </li>
          <li>
            <strong>Threshold –</strong> Set manually or use
            <em> Smart Suggestion</em> based on trading volume.
          </li>
        </ul>

        {/* 4.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.3 Configuring Notifications</h3>
        <ul className="list-disc list-inside space-y-3 mt-4">
          <li>Email – deliver to your verified inbox.</li>
          <li>Discord / Slack – paste an Incoming Webhook URL.</li>
          <li>
            Telegram – provide <code>{`{"bot_token":"…","chat_id":"…"}`}</code>.
          </li>
        </ul>
        <p className="mt-4 font-bold">Always run <em>Test</em> before saving.</p>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 5: The Events Feed
  // -----------------------------------------------------------------------
  {
    id: "chapter-5",
    title: "5. The Events Feed",
    level: 1,
    content: (
      <>
        <p>
          Every alert is permanently logged in your Events Feed – a powerful,
          filterable database for research and due‑diligence.
        </p>

        {/* 5.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.1 Understanding the Table</h3>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>Watcher –</strong> Rule that triggered.</li>
          <li><strong>From / To –</strong> Wallet addresses.</li>
          <li><strong>Amount / USD –</strong> Token quantity + value.</li>
          <li><strong>Tx Hash –</strong> Click to open on Etherscan.</li>
        </ul>

        {/* 5.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.2 Filtering Capabilities</h3>
        <p>
          Combine Watcher, Token, Address, Value and Date filters to zero‑in on
          meaningful activity.
        </p>

        {/* 5.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">5.3 Connecting to the Source</h3>
        <p>
          Each transaction hash links to a public block explorer for full, raw
          blockchain data.
        </p>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 6: Billing & Plans
  // -----------------------------------------------------------------------
  {
    id: "chapter-6",
    title: "6. Billing &amp; Plans",
    level: 1,
    content: (
      <>
        <p>
          TokenWatcher offers three tiers – <strong>Free</strong>,
          <strong> Medium</strong> and <strong>Advanced</strong> – defined by
          <code> watcher_limit</code> (max simultaneous Watchers).
        </p>
        <p className="mt-4 font-bold">
          Paused Watchers still count toward the limit. Delete to free a slot.
        </p>

        {/* 6.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.1 Viewing Your Usage</h3>
        <p>
          Billing → Current Subscription shows “used / limit” in real time.
        </p>

        {/* 6.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.2 Upgrading or Downgrading</h3>
        <p>
          Change plans instantly from the Billing page. Any custom watcher limit
          overrides are reset when you switch tiers.
        </p>

        {/* 6.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.3 Future – Stripe Payments</h3>
        <p>
          A fully‑automated Stripe billing flow (pro‑rated, invoicing, etc.) is
          under active development.
        </p>
      </>
    ),
  },

  // -----------------------------------------------------------------------
  // CHAPTER 7: Troubleshooting & FAQ
  // -----------------------------------------------------------------------
  {
    id: "chapter-7",
    title: "7. Troubleshooting &amp; FAQ",
    level: 1,
    content: (
      <>
        <p>
          Having issues? Start here.
        </p>

        {/* 7.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.1 I’m not receiving alerts</h3>
        <ol className="list-decimal list-inside space-y-2 mt-2">
          <li>Click <em>Test</em> on the Watcher.</li>
          <li>Verify your notification target (email or webhook).</li>
          <li>Ensure the Watcher status is <strong>Active</strong>.</li>
          <li>Lower an overly‑high threshold.</li>
          <li>Check spam if using email.</li>
        </ol>

        {/* 7.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.2 Smart Threshold seems off</h3>
        <p>
          Suggestions scale with 24‑h volume – high‑cap tokens → high values;
          low‑cap → lower values. Adjust to suit your strategy.
        </p>

        {/* 7.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.3 Finding my Discord/Slack Webhook</h3>
        <p>
          Discord: Channel → Edit → Integrations → Webhooks → <strong>New
          Webhook</strong>. Copy URL.
        </p>
        <p className="mt-2">
          Slack: Workspace → Manage apps → Incoming Webhooks → <strong>Add to
          Slack</strong>. Choose a channel and copy the generated URL.
        </p>

        {/* 7.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.4 Telegram Bot Token &amp; Chat ID</h3>
        <p>
          Create a bot via <strong>@BotFather</strong>, obtain the token, then
          retrieve your Chat ID via <code>getUpdates</code>. Combine as JSON:
          <code>{`{"bot_token":"…","chat_id":"…"}`}</code>.
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  const { theme, systemTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("chapter-1");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    const currentRefs = sectionRefs.current;
    Object.values(currentRefs).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(currentRefs).forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  return (
    <div
      className={`flex flex-col min-h-screen ${isDark ? "bg-neutral-900" : "bg-white"}`}
    >
      <main className="flex-grow">
        {/* Header */}
        <section
          className={`py-16 md:py-20 text-center border-b ${isDark ? "border-neutral-800 bg-neutral-900" : "border-gray-200 bg-gray-50"}`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white">
              The Complete TokenWatcher Manual
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              From first login to deep on‑chain analytics – everything you need in
              one place.
            </p>
          </div>
        </section>

        {/* Main Two‑Column Layout */}
        <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] lg:gap-12">
            {/* Content */}
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

            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <DocsNav sections={sections} activeSection={activeSection} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
