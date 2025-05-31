// dashboard/tokenwatcher-app/src/components/home/HowItWorksSection.tsx
import React from 'react';

const steps = [
  {
    title: 'Sign Up',
    description: 'Create your account in seconds.',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 5a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z"
        />
      </svg>
    ),
  },
  {
    title: 'Create a Watcher',
    description: 'Enter token address & threshold.',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 10h2l2-3m0 0l3-4 3 4M13 7h6l2 3-2 3h-6l-2-3zM5 15h14l1 5H4l1-5z"
        />
      </svg>
    ),
  },
  {
    title: 'Choose a Webhook',
    description: 'Connect Slack, Discord or Telegram.',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7h18M3 12h18M3 17h18"
        />
      </svg>
    ),
  },
  {
    title: 'Get Notified',
    description: 'Whenever a big transfer happens, receive instant alerts.',
    icon: (
      <svg
        className="w-8 h-8 text-blue-600"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405M11 21h-1a2 2 0 01-2-2V9a2 2 0 012-2h1a2 2 0 012 2v10a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-gray-100">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.title}
              className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow"
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4">
                {step.icon}
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                {step.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
