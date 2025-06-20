// src/app/dashboard/layout.tsx
"use client";

import React, { ReactNode } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";

// Este layout es responsable de dibujar el marco del dashboard
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // El AuthProvider y ThemeProvider ya vienen del layout raíz
    <div className="flex flex-col min-h-screen bg-[#f0f2f5] dark:bg-[#1c1c1c]">
      <DashboardHeader />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
        </div>
      </main>
    </div>
  );
}
