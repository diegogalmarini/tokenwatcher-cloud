// File: src/components/home/WhySection.tsx
import React from "react";

export default function WhySection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-50">
      <div className="max-w-5xl mx-auto text-center px-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-900 mb-4">
          Why TokenWatcher?
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-700 mb-6">
          Monitoring large token transfers manually is slow and error-prone.
          Traditional solutions rely on expensive data feeds or require you to
          maintain your own node.
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-700">
          TokenWatcher solves this by providing an easy, plug-and-play service:
          simply specify which ERC-20 contract to watch and what volume matters
          to you. Instantly get notified to Slack, Discord, or Telegram—no
          devops required.
        </p>
      </div>
    </section>
  );
}
