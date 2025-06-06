// File: src/components/home/FAQSection.tsx
"use client";

import React from "react";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

const faqs = [
  {
    question: "Which tokens can I monitor?",
    answer:
      "You can monitor any ERC-20 token on Ethereum, Polygon, and Arbitrum. If you need multi-chain beyond these, please reach out to support@tokenwatcher.app.",
  },
  {
    question: "How much does it cost?",
    answer:
      "We offer a free tier that supports up to 5 watchers. If you need more watchers, contact support@tokenwatcher.app.",
  },
  {
    question: "Can I change my webhooks later?",
    answer:
      "Yes. In your dashboard, click 'Edit' on any watcher to update the webhook URL at any time.",
  },
  {
    question: "How do I know my alert was sent?",
    answer:
      "Every time a transfer exceeds your threshold, an alert is logged under the corresponding watcher. You can view the alert history in the “Events” section of the dashboard. If you still have questions, reach out to support@tokenwatcher.app.",
  },
];

/**
 * Recibe `isDark` desde el padre para decidir colores de fondo y texto.
 */
interface FAQSectionProps {
  isDark: boolean;
}

export default function FAQSection({ isDark }: FAQSectionProps) {
  return (
    <section
      className={`py-16 w-full ${
        isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8] text-gray-900"
      }`}
    >
      <div className="max-w-4xl mx-auto px-6">
        <h2
          className={`text-3xl font-bold text-center mb-8 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Disclosure key={faq.question}>
              {({ open }) => (
                <div
                  className={`border rounded-lg ${
                    isDark
                      ? "bg-[#a1a1a1] bg-[#262626]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Disclosure.Button
                    className={`flex justify-between w-full px-6 py-4 text-left rounded-lg focus:outline-none focus-visible:ring focus-visible:ring-primary ${
                      isDark ? "bg-[#262626] text-white" : "bg-white text-gray-900"
                    }`}
                  >
                    <span className="font-medium">{faq.question}</span>
                    <ChevronUpIcon
                      className={`${
                        open ? "transform rotate-180" : ""
                      } h-6 w-6 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel
                    className={`px-6 pt-4 pb-6 rounded-b-lg ${
                      isDark
                        ? "bg-[#262626] text-gray-300"
                        : "bg-white text-gray-700"
                    }`}
                  >
                    {faq.answer}
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </section>
  );
}
