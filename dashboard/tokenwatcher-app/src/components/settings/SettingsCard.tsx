// src/components/settings/SettingsCard.tsx
import React, { ReactNode } from 'react';

interface SettingsCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function SettingsCard({ title, description, children }: SettingsCardProps) {
  return (
    <section className="bg-white dark:bg-[#404040] shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="p-6 bg-gray-50 dark:bg-neutral-800/40">
        {children}
      </div>
    </section>
  );
}