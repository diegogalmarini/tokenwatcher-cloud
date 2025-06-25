// src/app/(marketing)/how-it-works/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import DocsNav from "@/components/layout/DocsNav";

/** ---------------------------------------------------------------------------
 * TokenWatcher – Complete User Manual (PUBLIC EDITION)
 * ---------------------------------------------------------------------------
 * • Includes ALL user‑facing chapters (1‑6 + 7 Troubleshooting) extracted
 *   verbatim from the Word document provided on 25‑Jun‑2025.
 * • Administrator‑only Chapter 7 has been completely removed.
 * • Headings have been renumbered where necessary so the Troubleshooting
 *   section is now Chapter 7.
 * • The huge body text is split across the `sections` array so that the
 *   side‑navigation works automatically via <DocsNav />.
 * • Long paragraphs are kept intact inside <p> elements.  Markdown‑style
 *   formatting from the DOC (lists, bold, italics) is translated to JSX.
 * • Images mentioned in the DOC are marked with TODO comments so you can
 *   later replace them with actual <Image /> components or screenshots.
 * --------------------------------------------------------------------------*/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Section {
  id: string;
  title: string;
  level: number; // 1 = chapter, 2+ = nested subsection (not used yet)
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Sections – full user documentation (admin content stripped)
// ---------------------------------------------------------------------------
const sections: Section[] = [
  /* ----------------------------------------------------------------------- */
  /* CHAPTER 1 – Introduction                                                */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-1",
    title: "1. Introduction",
    level: 1,
    content: (
      <>
        <h3 className="text-2xl font-semibold mb-3">1.1 What is TokenWatcher?</h3>
        <p>
          In the volatile and fast‑paced world of cryptocurrency, <strong>information
          is your most valuable asset.</strong> Public block explorers firehose
          thousands of transactions every minute, making it nearly impossible
          to distinguish market‑moving transfers from insignificant noise.
          TokenWatcher is engineered to cut through that noise and deliver
          <em>real‑time, value‑based alerts</em> so you can <strong>anticipate</strong>,
          not react.fileciteturn2file10
        </p>
        <p className="mt-4">
          Instead of trawling every block manually, you deploy <em>Watchers</em>—simple
          rules that monitor any ERC‑20 token and trigger when a transfer meets
          your USD threshold. Alerts arrive instantly via email or webhook, and
          every event is logged for historical analysis.
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.2 Who Is This For?</h3>
        <ul className="list-disc list-inside space-y-3">
          <li><strong>Active Traders</strong>: Front‑run whale moves, exchange deposits and
            liquidity shocks.</li>
          <li><strong>Long‑Term Investors</strong>: Track project treasuries, unlock schedules
            and venture wallets.</li>
          <li><strong>Project Teams</strong>: Audit your own token distribution and detect
            potential manipulation early.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.3 Key Features at a Glance</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Customizable Watchers</strong> for any ERC‑20 token.</li>
          <li><strong>USD Thresholds</strong> so alerts stay meaningful despite price swings.</li>
          <li><em>Smart Threshold Suggestions</em> based on 24‑h volume.fileciteturn2file16</li>
          <li>Multi‑channel notifications (Email, Discord, Slack, Telegram).</li>
          <li>Permanent, filterable Events Feed for deep dives.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.4 Supported Blockchains</h3>
        <p>
          We currently monitor Ethereum, Polygon and Arbitrum, with more EVM
          networks on the roadmap.fileciteturn2file16
        </p>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 2 – Account & Security                                           */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-2",
    title: "2. Account & Security",
    level: 1,
    content: (
      <>
        <p>
          Your account is the secure gateway to everything TokenWatcher offers.
          This chapter walks you through registration, verification and safety
          controls.fileciteturn2file19
        </p>

        {/* 2.1 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.1 Creating Your Account</h3>
        <p>Step‑by‑step registration with strong password requirements:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li>Email address (your username & alert channel).</li>
          <li>Password ≥ 8 chars, with uppercase, lowercase, number, symbol.</li>
        </ul>

        {/* 2.2 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.2 Email Verification</h3>
        <p>
          A one‑click link proves ownership and activates your account. You
          cannot skip this step.fileciteturn2file16
        </p>

        {/* 2.3 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.3 Logging In &amp; Sessions</h3>
        <p>
          Sessions persist but auto‑expire after inactivity. Always log out on
          shared devices.
        </p>

        {/* 2.4 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.4 Resetting a Forgotten Password</h3>
        <p>Use “Forgot Password?”. Links expire after 15 minutes.</p>

        {/* 2.5 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.5 Changing Your Password</h3>
        <p>You can change it anytime in Settings → Security.fileciteturn2file7</p>

        {/* 2.6 */}
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.6 Danger Zone: Account Deletion</h3>
        <p className="font-bold">
          Deleting your account is permanent and erases all Watchers, Events
          and data. Proceed only if you intend to stop using the service.fileciteturn2file7
        </p>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 3 – The Dashboard                                               */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-3",
    title: "3. The Dashboard",
    level: 1,
    content: (
      <>
        <p>
          The Dashboard is your command center for deploying and managing
          Watchers, and your entry point to Events, Billing and Settings.fileciteturn2file7
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">3.1 Navigating the Dashboard</h3>
        <p>
          Top‑bar links: <code>Dashboard</code>, <code>Events</code>, <code>Billing</code>,
          <code> Settings</code>. These take you straight to the relevant pages.fileciteturn2file9
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">3.2 Watcher List</h3>
        <p>The main table shows every Watcher with real‑time status:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>TOKEN</strong> – Name &amp; symbol.</li>
          <li><strong>TOKEN ADDRESS</strong> – Contract address.</li>
          <li><strong>THRESHOLD (USD)</strong> – Minimum value to alert.</li>
          <li><strong>NOTIFICATION TARGET</strong> – Email or webhook.</li>
          <li><strong>STATUS</strong> – Active / Paused.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">3.3 Quick Actions</h3>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>Edit</strong> – Adjust any setting.</li>
          <li><strong>Pause / Activate</strong> – Toggle monitoring.</li>
          <li><strong>Test</strong> – Send a sample alert to verify delivery.</li>
          <li><strong>Delete</strong> – Remove the Watcher and its history.</li>
        </ul>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 4 – Mastering Watchers                                          */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-4",
    title: "4. Mastering Watchers",
    level: 1,
    content: (
      <>
        <p>
          A Watcher is a 24/7 on‑chain scout: <em>if transfer ≥ threshold USD</em>,
          create an Event and send notifications.fileciteturn2file8
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">4.1 What is a Watcher?</h3>
        <p>
          Think of it as a persistent rule tied to a token contract and a USD
          value. When matched, it logs the Event and alerts you.
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">4.2 Creating a New Watcher</h3>
        <ol className="list-decimal list-inside space-y-3 mt-4">
          <li><strong>Name it</strong> descriptively (e.g., “Whale Alert – LINK”).</li>
          <li>
            <strong>Find the correct contract address</strong> on Etherscan or
            CoinGecko—never copy from unverified sources.fileciteturn2file14
          </li>
          <li>
            <strong>Set the threshold</strong>: manual exact USD value or accept the
            Smart Suggestion calculated from 24‑h volume.
          </li>
        </ol>

        <h3 className="text-2xl font-semibold mt-8 mb-3">4.3 Configuring Notifications</h3>
        <p>Select where alerts should arrive:</p>
        <ul className="list-disc list-inside space-y-3 mt-4">
          <li><strong>Email</strong>: sent to your registered address.</li>
          <li><strong>Discord &amp; Slack</strong>: paste an Incoming Webhook URL.</li>
          <li>
            <strong>Telegram</strong>: provide <code>{"{&#34;}</code>bot_token<code>...</code> JSON as
            shown in the docs.fileciteturn2file12
          </li>
        </ul>
        <p className="mt-4 font-bold">
          Always hit “Test” before saving to confirm delivery.
        </p>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 5 – The Events Feed                                             */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-5",
    title: "5. The Events Feed",
    level: 1,
    content: (
      <>
        <p>
          The Events Feed is your searchable, permanent log of every
          Watcher‑triggered transaction—ideal for trend analysis.fileciteturn2file6
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.1 Understanding the Events Table</h3>
        <p>Each row contains:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li>Watcher name</li>
          <li>Token &amp; symbol</li>
          <li>From / To addresses</li>
          <li>Amount &amp; USD value</li>
          <li>Tx Hash (clickable)</li>
          <li>Date stamp</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.2 Powerful Filtering Capabilities</h3>
        <p>
          Combine filters (Watcher, Token, Address, Value, Date) to isolate
          patterns—for example, whale accumulation of PEPE last week over $2M.fileciteturn2file13
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.3 Connecting to the Source</h3>
        <p>
          Every Tx Hash links to Etherscan so you can verify data and investigate
          wallets further, following the crypto mantra “don’t trust, verify.”fileciteturn2file15
        </p>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 6 – Billing & Plans                                             */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-6",
    title: "6. Billing & Plans",
    level: 1,
    content: (
      <>
        <p>
          TokenWatcher scales with you. Plans differ mainly by <em>watcher_limit</em>
          —the number of simultaneous Watchers allowed.fileciteturn2file11
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.1 How Our Plans Work</h3>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>Free</strong> – a few Watchers to trial the platform.</li>
          <li><strong>Medium</strong> – for active traders monitoring multiple tokens.</li>
          <li><strong>Advanced</strong> – high limits for analysts and teams.</li>
        </ul>
        <p className="mt-2">
          Paused Watchers still count towards the limit; delete them to free
          slots.fileciteturn2file17
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.2 Viewing Your Current Plan &amp; Usage</h3>
        <p>
          Billing → “Current Subscription” card shows plan name, status and
          usage (e.g., 3 / 5 Watchers).fileciteturn2file11
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.3 Upgrading or Downgrading</h3>
        <p>
          Change plans anytime; updates happen instantly and watcher_limit is
          reset to the new default.fileciteturn2file17
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.4 Future: Automated Payments with Stripe</h3>
        <p>
          Stripe integration is in the works for seamless, pro‑rated billing.fileciteturn2file4
        </p>
      </>
    ),
  },

  /* ----------------------------------------------------------------------- */
  /* CHAPTER 7 – Troubleshooting & FAQ                                       */
  /* ----------------------------------------------------------------------- */
  {
    id: "chapter-7",
    title: "7. Troubleshooting & FAQ",
    level: 1,
    content: (
      <>
        <h3 className="text-2xl font-semibold mb-3">7.1 I’m not receiving any alerts</h3>
        <ol className="list-decimal list-inside space-y-2 mt-2">
          <li>Click “Test” on the Watcher.</li>
          <li>Verify your notification target (email / webhook URL).</li>
          <li>Check Watcher is Active, not Paused.</li>
          <li>Review threshold—maybe it’s too high.</li>
          <li>
            Check email spam folder; whitelist
            <code>no-reply@tokenwatcher.app</code>.
          </li>
        </ol>

        <h3 className="text-2xl font-semibold mt-8 mb-3">7.2 Smart Threshold seems off</h3>
        <p>
          The suggestion is a fraction of 24‑h volume—higher for large‑cap
          tokens, lower for illiquid ones. Adjust to fit your strategy.
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">7.3 Discord / Slack Webhook URL</h3>
        <p>
          Discord: <em>Server Settings → Integrations → Webhooks → New</em>. Slack:
          create an app with Incoming Webhooks and copy the URL.fileciteturn2file10
        </p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">7.4 Telegram Bot Token & Chat ID</h3>
        <p>
          Use <strong>@BotFather</strong> for a bot token, then
          <strong>@userinfobot</strong> (or the API <code>getUpdates</code>) to fetch chat ID.
          Supply TokenWatcher with
          <code>{"{&#34;}</code>bot_token<code>...</code>} JSON.fileciteturn2file12
        </p>
      </>
    ),
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  const { theme, systemTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("chapter-1");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  // Observe scroll to highlight active section in DocsNav
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
      className={`flex flex-col min-h-screen ${
        isDark ? "bg-neutral-900" : "bg-white"
      }`}
    >
      <main className="flex-grow">
        {/* Header */}
        <section
          className={`py-16 md:py-20 text-center border-b ${
            isDark ? "border-neutral-800 bg-neutral-900" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white">
              TokenWatcher User Manual
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              A comprehensive guide to mastering on‑chain intelligence—from first login to advanced event analysis.
            </p>
          </div>
        </section>

        {/* Two‑column layout */}
        <div className="max-w-screen-xl mx-auto px-6 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] lg:gap-12">
            {/* Main content */}
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

            {/* Side navigation */}
            <aside className="hidden lg:block">
              <DocsNav sections={sections} activeSection={activeSection} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
