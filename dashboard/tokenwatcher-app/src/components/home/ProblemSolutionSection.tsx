// dashboard/tokenwatcher-app/src/components/home/ProblemSolutionSection.tsx
import React from 'react';

export default function ProblemSolutionSection() {
  // CORREGIDO: Cambiado bg-white a bg-[#e8e8e8] y añadido el fondo para dark mode
  return (
    <section className="py-16 bg-[#e8e8e8] dark:bg-[#262626]">
      <div className="max-w-5xl mx-auto text-center px-6">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Why TokenWatcher?
        </h2>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
          Monitoring large token transfers manually is slow and error-prone. Traditional solutions rely on expensive data feeds
          or require you to maintain your own node.
        </p>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          TokenWatcher solves this by providing an easy-to-use, plug-and-play service: simply specify which ERC-20 contract to
          watch and what volume matters to you. Instantly get notified to Slack, Discord, or Telegram—no DevOps required.
        </p>
      </div>
    </section>
  );
}