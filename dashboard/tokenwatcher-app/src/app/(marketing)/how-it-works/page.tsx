// src/app/(marketing)/how-it-works/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import DocsNav from "@/components/layout/DocsNav";

/** ---------------------------------------------------------------------------
 * TokenWatcher – Complete User Manual (Public Edition)
 * ---------------------------------------------------------------------------
 * • This component renders the complete user-facing manual, reflecting the
 * full detail of the "The Complete User Manual" document.
 * • All user-facing chapters (1-6) and the Troubleshooting FAQ (Chapter 8)
 * have been included verbatim to ensure completeness.
 * • The internal Administrator-only chapter (Chapter 7) has been omitted.
 * • All original text, lists, and formatting are translated to JSX for a
 * rich, easy-to-read experience.
 * • The page uses a two-column layout with a sticky side-navigation that
 * highlights the user's current position in the document.
 * --------------------------------------------------------------------------*/

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Section {
  id: string;
  title: string;
  level: number; // 1 = chapter, 2+ = subsection
  content: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Sections – Full user documentation from the provided manual
// ---------------------------------------------------------------------------
const sections: Section[] = [
  // --- CHAPTER 1: Introduction to TokenWatcher ---
  {
    id: 'chapter-1',
    title: '1. Introduction',
    level: 1,
    content: (
      <>
        <h3 className="text-2xl font-semibold mb-3">1.1 What is TokenWatcher?</h3>
        <p>In the volatile and fast-paced world of cryptocurrency, information is your most valuable asset. The ability to access and act on relevant data faster than the rest of the market provides a critical, competitive edge. However, tracking significant on-chain events manually is an overwhelming, if not impossible, task. Public block explorers are a firehose of raw data, streaming thousands of transactions every minute and making it nearly impossible to distinguish between market-moving transfers and insignificant noise.</p>
        <p className="mt-4">TokenWatcher is engineered to cut through this noise and deliver actionable intelligence directly to you. We provide a powerful yet elegantly simple solution to monitor on-chain activity that matters to <em>your</em> strategy. With TokenWatcher, you stop reacting to the market and start anticipating it.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.2 Who Is This For?</h3>
        <ul className="list-disc list-inside space-y-3">
          <li><strong>For the Active Trader:</strong> Track whale wallets, get instant alerts on influential player movements, front-run market-moving news like exchange deposits, and identify unusual activity that could signal a shift in market sentiment.</li>
          <li><strong>For the Long-Term Investor:</strong> Monitor the health of your portfolio by tracking project treasuries for signs of development funding or team sales, and anticipate supply changes from token unlocks or VC wallet movements.</li>
          <li><strong>For Project Teams:</strong> Enhance community transparency by monitoring your own token's on-chain activity, understand token distribution among your holders, and detect market anomalies or potential manipulation that could require a public response.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.3 Key Features at a Glance</h3>
        <ul className="list-disc list-inside space-y-2 mt-2">
          <li><strong>Customizable Watchers:</strong> Create highly specific monitors for any ERC-20 token on our supported networks.</li>
          <li><strong>USD-Based Value Thresholds:</strong> Set alerts based on a simple, real-world metric: the transaction's value in US Dollars.</li>
          <li><strong>Smart Threshold Suggestions:</strong> Our system analyzes a token's recent 24-hour trading volume to suggest a meaningful threshold.</li>
          <li><strong>Multi-Channel Notifications:</strong> Receive seamless, real-time integration with Email, Discord, Slack, and Telegram.</li>
          <li><strong>Detailed & Filterable Event History:</strong> Every alert is logged in your personal, searchable on-chain intelligence database for historical analysis.</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">1.4 Supported Blockchains</h3>
        <p>To provide the most accurate, low-latency data, TokenWatcher currently focuses on the most active EVM-compatible networks: Ethereum, Polygon, and Arbitrum. Our engineering team is constantly working to integrate new, high-demand blockchains.</p>
      </>
    )
  },
  // --- CHAPTER 2: Your Account - Setup and Management ---
  {
    id: 'chapter-2',
    title: '2. Account & Security',
    level: 1,
    content: (
      <>
        <p>Your TokenWatcher account is your secure gateway to all platform features. This chapter provides a detailed guide on creating, securing, and managing your account to ensure a smooth, safe, and uninterrupted experience.</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.1 Creating Your Account</h3>
        <p>Getting started is a straightforward process. You will need a valid email address and a secure password. For your protection, your password must include:</p>
        <ul className="list-disc list-inside space-y-2 mt-2">
            <li>A minimum of 8 characters.</li>
            <li>At least one uppercase letter (A-Z).</li>
            <li>At least one lowercase letter (a-z).</li>
            <li>At least one number (0-9).</li>
            <li>At least one special character (e.g., !, @, #, $, %).</li>
        </ul>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.2 The Importance of Email Verification</h3>
        <p>Upon completing registration, TokenWatcher will dispatch a verification link to your email. This is a mandatory security step. It confirms you are the legitimate owner of the email and validates the notification channel. You must click the link to activate your account. If you don't receive it, check your spam folder and mark the email as "Not Spam".</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.3 Logging In & Session Management</h3>
        <p>Once active, log in with your credentials. For your convenience, your session is securely stored. For enhanced security, the access token will expire after a period of inactivity, requiring you to log in again.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">2.4 Resetting a Forgotten Password</h3>
        <p>If you forget your password, click "Forgot Password?" on the Login page. We will send a secure, single-use link to your inbox that expires in 15 minutes.</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">2.5 Account Security: Changing Your Password</h3>
        <p>You can change your password anytime from the "Settings" page. You will be required to enter your current password before setting a new one.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">2.6 The Danger Zone: Deleting Your Account</h3>
        <p className="font-bold">Deleting your account is permanent and irreversible.</p>
        <p className="mt-2">This action erases all your data: your profile, all created Watchers, notification settings, and your entire Event History. This data cannot be recovered by you or by the TokenWatcher support team. Please be certain before proceeding.</p>
      </>
    )
  },
  // --- CHAPTER 3: The Dashboard - Your Command Center ---
  {
    id: 'chapter-3',
    title: '3. The Dashboard',
    level: 1,
    content: (
      <>
        <p>The Dashboard is the first page you see after logging in and serves as your primary workspace. It's designed for an at-a-glance overview and provides quick access to the most critical functions.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">3.2 The Watcher List</h3>
        <p>The central feature of the Dashboard is the Watcher List. This table provides a clear, organized view of every Watcher you have created. Each column gives critical information:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
          <li><strong>TOKEN:</strong> The official name and symbol of the token being monitored.</li>
          <li><strong>TOKEN ADDRESS:</strong> The unique contract address of the token.</li>
          <li><strong>THRESHOLD (USD):</strong> The value that must be met or exceeded to trigger an alert.</li>
          <li><strong>NOTIFICATION TARGET:</strong> Where your alerts are being sent (Email, webhook URL, etc.).</li>
          <li><strong>STATUS:</strong> Shows if a Watcher is "Active" or "Paused".</li>
        </ul>

        <h3 className="text-2xl font-semibold mt-8 mb-3">3.3 Quick Actions</h3>
        <p>To the far right of each row, you'll find powerful action buttons for immediate management:</p>
        <ul className="list-disc list-inside space-y-2 mt-4">
            <li><strong>Edit:</strong> Opens the configuration form to make quick adjustments.</li>
            <li><strong>Pause / Activate:</strong> Toggles monitoring. A paused watcher does not generate alerts.</li>
            <li><strong>Test:</strong> Sends a sample notification to your configured target to confirm the setup is working.</li>
            <li><strong>Delete:</strong> Permanently removes the Watcher and its history. This action is irreversible.</li>
        </ul>
      </>
    )
  },
  // --- CHAPTER 4: Mastering Watchers - Your Eyes on the Blockchain ---
  {
    id: 'chapter-4',
    title: '4. Mastering Watchers',
    level: 1,
    content: (
      <>
        <p>A Watcher is a persistent, autonomous monitoring engine. Understanding how to configure them is key to unlocking the full power of the platform.</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">4.1 What is a "Watcher"?</h3>
        <p>Think of a Watcher as your personal on-chain scout, working 24/7. It's a simple rule you define: a target token address and a minimum transaction value in USD. When it finds a matching transaction, it triggers an "Event," which is logged and sent as a notification.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">4.2 Creating a New Watcher: A Detailed Walkthrough</h3>
        <ol className="list-decimal list-inside space-y-3 mt-4">
          <li><strong>Name Your Watcher:</strong> Use a descriptive name (e.g., "Whale Movements - LINK").</li>
          <li><strong>Find the Correct Token Address:</strong> This is critical. Use a trusted source like Etherscan or CoinGecko. Never copy an address from an unverified source.</li>
          <li><strong>Set the Threshold:</strong> Enter a manual USD value or use our "Smart Threshold Suggestion". The suggestion is based on a small percentage of the token's 24-hour trading volume, helping you create effective, low-noise alerts from day one.</li>
        </ol>

        <h3 className="text-2xl font-semibold mt-8 mb-3">4.3 Configuring Notifications: Getting Your Alerts</h3>
        <p>Tell your Watcher where to send the alerts:</p>
        <ul className="list-disc list-inside space-y-3 mt-4">
          <li><strong>Email:</strong> Alerts are sent to your registered address. Add <code>no-reply@tokenwatcher.app</code> to your safe senders list.</li>
          <li><strong>Discord & Slack:</strong> Use "Incoming Webhooks." In your server settings, create a new webhook and paste the generated URL.</li>
          <li><strong>Telegram:</strong> Requires a Bot Token and Chat ID. See the FAQ section for a detailed guide.</li>
        </ul>
        <p className="mt-4 font-bold">Always use the "Test" button before saving to confirm your setup is working correctly.</p>
      </>
    )
  },
  // --- CHAPTER 5: The Events Feed - Analyzing On-Chain Activity ---
  {
    id: 'chapter-5',
    title: '5. The Events Feed',
    level: 1,
    content: (
      <>
        <p>The Events Feed is your searchable database of every significant transaction detected. It's designed to help you identify trends and conduct deep-dive investigations.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.1 Understanding the Events Table</h3>
        <p>Each row is a snapshot of a transaction, including Watcher name, from/to addresses, token amount, USD value, and the transaction hash.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.2 Powerful Filtering Capabilities</h3>
        <p>Use the filter bar to find the signal in the noise. Combine filters (Watcher, Token, Address, Value, Date) to create highly specific queries. For example, search for all PEPE transfers from a specific whale wallet over $2M in the last week.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">5.3 Connecting to the Source</h3>
        <p>Every transaction hash links directly to a block explorer like Etherscan. This allows you to verify all data against the immutable blockchain and conduct deeper forensic analysis, following the crypto mantra: "don't trust, verify."</p>
      </>
    )
  },
  // --- CHAPTER 6: Billing and Subscription Plans ---
  {
    id: 'chapter-6',
    title: '6. Billing & Plans',
    level: 1,
    content: (
      <>
        <p>TokenWatcher scales with your needs. Our subscription model is based on one key metric: the <code>watcher_limit</code>.</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">6.1 How Our Plans Work</h3>
        <p>We offer Free, Medium, and Advanced tiers, each with a different watcher limit. <strong>Important: Paused Watchers still count towards your limit.</strong> To free up capacity, you must delete a Watcher.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.2 Viewing & Changing Your Plan</h3>
        <p>The "Billing" page shows your current plan and usage (e.g., "3 / 5 Watchers"). You can upgrade or downgrade at any time, and the change takes effect immediately. Note that changing plans will reset any custom watcher limit set by an administrator.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">6.4 Future: Automated Payments with Stripe</h3>
        <p>We are actively working on integrating Stripe for a fully automated and secure billing experience.</p>
      </>
    )
  },
  // --- CHAPTER 7: Troubleshooting & FAQ (Renumbered from Chapter 8) ---
  {
    id: 'chapter-7',
    title: '7. Troubleshooting & FAQ',
    level: 1,
    content: (
      <>
        <h3 className="text-2xl font-semibold mb-3">7.1 I'm not receiving any alerts. What should I do?</h3>
        <p>Follow this diagnostic checklist in order:</p>
        <ol className="list-decimal list-inside space-y-2 mt-2">
            <li><strong>Use the "Test" Button:</strong> This is the most important step. If the test fails, your notification target is misconfigured. If it works, the issue is with your watcher's conditions.</li>
            <li><strong>Verify Your Notification Target:</strong> Double-check every character of your webhook URL or email address.</li>
            <li><strong>Check Watcher Status:</strong> Ensure the watcher is "Active," not "Paused."</li>
            <li><strong>Review Your Threshold:</strong> Your threshold might be too high for the token's current market activity.</li>
            <li><strong>Check Email Spam:</strong> If using email, check your spam folder and whitelist <code>no-reply@tokenwatcher.app</code>.</li>
        </ol>

        <h3 className="text-2xl font-semibold mt-8 mb-3">7.2 My Smart Threshold suggestion seems off. Why?</h3>
        <p>The suggestion is based on a percentage of the token's 24h trading volume. For high-volume tokens (like WBTC), the suggestion will be high to avoid noise. For low-volume tokens, it will be much lower. It's a starting point; adjust it to fit your strategy.</p>
        
        <h3 className="text-2xl font-semibold mt-8 mb-3">7.3 How do I find my Discord/Slack Webhook URL?</h3>
        <p><strong>For Discord:</strong> In your server, go to <em>Server Settings → Integrations → Webhooks → New Webhook</em>. Copy the URL.</p>
        <p className="mt-2"><strong>For Slack:</strong> From your desktop app, go to <em>Workspace Settings → Manage apps</em>, search for "Incoming Webhooks," add it, and choose a channel to generate the URL.</p>

        <h3 className="text-2xl font-semibold mt-8 mb-3">7.4 How do I get my Telegram Bot Token & Chat ID?</h3>
        <p><strong>Step 1: Get Bot Token:</strong> In Telegram, search for the official <strong>@BotFather</strong>, start a chat, and use the <code>/newbot</code> command. Follow the prompts to get your API Token.</p>
        <p className="mt-2"><strong>Step 2: Get Chat ID:</strong> For personal alerts, message <strong>@userinfobot</strong>. For group alerts, add your bot to the group, send a message, and visit <code>https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates</code> in a browser to find the group's Chat ID (it will be a negative number).</p>
        <p className="mt-2"><strong>Step 3: Format:</strong> Paste into TokenWatcher using this exact JSON structure: <code>{"{\"bot_token\": \"YOUR_TOKEN\", \"chat_id\": \"YOUR_CHAT_ID\"}"}</code></p>
      </>
    )
  },
];

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  const { theme, systemTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<string>("chapter-1");
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const isDark = theme === "dark" || (theme === "system" && systemTheme === "dark");

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
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-neutral-900" : "bg-white"}`}>
      <main className="flex-grow">
        {/* Header */}
        <section
          className={`py-16 md:py-20 text-center border-b ${
            isDark ? "border-neutral-800 bg-neutral-900" : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900 dark:text-white">
              The Complete TokenWatcher Manual
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Your comprehensive guide to mastering on-chain intelligence—from first login to advanced event analysis.
            </p>
          </div>
        </section>

        {/* Two-column layout */}
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
