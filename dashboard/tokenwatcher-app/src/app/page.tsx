// src/app/page.tsx
"use client";

import WatcherList from "@/components/watchers/WatcherList";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <header className="max-w-5xl mx-auto mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          TokenWatcher Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Create watchers, view recent events, and receive real-time alerts.
        </p>
      </header>
      <div className="max-w-5xl mx-auto">
        <WatcherList />
      </div>
    </main>
  );
}
