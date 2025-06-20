// src/app/dashboard/layout.tsx
"use client";

import React, { ReactNode } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#1a1a1a]">
      <DashboardHeader />
      <main className="w-full flex-grow p-4 sm:p-6 lg:p-8">
        {/* Usamos w-full para que el contenido se estire */}
        <div className="w-full">
            {children}
        </div>
      </main>
    </div>
  );
}
