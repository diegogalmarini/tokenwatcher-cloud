// File: src/components/home/FAQSection.tsx
"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "Which tokens can I monitor?",
    answer:
      "You can monitor any ERC-20 token on Ethereum, Polygon, and Arbitrum. More chains are coming soon.",
  },
  {
    question: "How much does it cost?",
    answer:
      "We offer a freemium tier that includes up to 3 active watchers and 100 alerts per day. Check our Pricing section for details.",
  },
  {
    question: "Can I change my webhooks?",
    answer:
      "Yes. From the dashboard, simply edit your watcher and update the webhook URL at any time.",
  },
  {
    question: "How do I know if an alert was delivered?",
    answer:
      "Your dashboard shows each event’s status, and your Slack/Discord/Telegram integration will confirm receipt.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleIndex = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((item, idx) => (
            <div
              key={idx}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-800 text-left"
                onClick={() => toggleIndex(idx)}
              >
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-500 dark:text-gray-300 transform transition-transform ${
                    openIndex === idx ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
              {openIndex === idx && (
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
