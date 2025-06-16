// src/app/dashboard/layout.tsx
"use client";

import React, { ReactNode } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";

// Este layout es responsable de dibujar el marco del dashboard
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // El AuthProvider y ThemeProvider ya vienen del layout raíz
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      <DashboardHeader />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      {/* Intencionadamente no hay Footer en el dashboard */}
    </div>
  );
}