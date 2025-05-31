// File: dashboard/tokenwatcher-app/src/components/home/FAQSection.tsx
"use client";

import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "¿Qué tokens puedo monitorear?",
    answer:
      "Puedes monitorear cualquier token ERC-20 en las redes Ethereum, Polygon y Arbitrum. Pronto agregaremos más cadenas.",
  },
  {
    question: "¿Cuánto cuesta?",
    answer:
      "Tenemos un plan freemium que incluye hasta 3 watchers activos y 100 alertas diarias. Consulta nuestra sección de Pricing para más detalles.",
  },
  {
    question: "¿Puedo cambiar mis webhooks?",
    answer:
      "Sí. Desde el dashboard, edita tu watcher y modifica la URL de tu webhook en cualquier momento.",
  },
  {
    question: "¿Cómo sé que la alerta fue enviada?",
    answer:
      "En el dashboard verás el historial de eventos y marcadores de estado. Además, tu integración de Slack/Discord/Telegram confirmará la recepción.",
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
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
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
