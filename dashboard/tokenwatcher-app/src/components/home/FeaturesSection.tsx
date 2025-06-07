// File: src/components/home/FeaturesSection.tsx

import React from "react";

const features = [
  {
    title: "Instant Alerts",
    description:
      "Configure custom thresholds and receive notifications the moment a transfer exceeds your limit.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Multi-Chain Support",
    description: "Ethereum, Polygon, Arbitrum—and more chains coming soon.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12l2 2 4-4m1-4h5v12h-5m-2 0H5V8h5"
        />
      </svg>
    ),
  },
  {
    title: "Flexible Webhooks",
    description:
      "Send alerts to Slack, Discord, Telegram, or any custom webhook endpoint.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 8h10M7 12h6m-6 4h10m-6-8v8"
        />
      </svg>
    ),
  },
  {
    title: "Zero Infrastructure",
    description:
      "No nodes, no servers—everything runs “in the cloud” and is maintenance-free.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 15a4 4 0 014-4h1V7a4 4 0 118 0v4h1a4 4 0 014 4v1H3v-1z"
        />
      </svg>
    ),
  },
  {
    title: "Secure & Reliable",
    description:
      "Built on FastAPI and PostgreSQL, with partitioned events for infinite scale.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 11c0-1.333.667-2.667 2-3.333C11.333 7 8 9 8 12v2l-2 1v2h12v-2l-2-1v-2c0-3-3.333-5-6-4.333z"
        />
      </svg>
    ),
  },
  {
    title: "Insightful Dashboard",
    description:
      "Manage your watchers and visualize token movements with real-time USD values and token logos in a clean, intuitive interface.",
    icon: (
      <svg
        className="w-8 h-8 bg-[#292929] rounded-full p-1 text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3.75h16.5M3.75 12h16.5m-16.5 4.5h16.5M19.5 3.75l-4.5 4.5m0 0l-4.5-4.5m4.5 4.5V19.5"
        />
      </svg>
    ),
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-[#e8e8e8] dark:bg-[#262626] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-gray-100">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-neutral-700 p-6 rounded-lg shadow-lg flex flex-col items-center text-center"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
