// src/app/dashboard/layout.tsx
"use client";

import React, { ReactNode } from "react";
import DashboardHeader from "@/components/layout/DashboardHeader";

// Este layout SÍ dibuja el marco para el dashboard.
// Los providers (tema, auth) los hereda del layout raíz.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      <DashboardHeader />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      {/* Intencionadamente no hay Footer en el dashboard */}
    </div>
  );
}