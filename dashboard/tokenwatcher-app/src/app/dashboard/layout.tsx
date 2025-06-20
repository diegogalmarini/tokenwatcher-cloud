// src/app/dashboard/layout.tsx
"use client";

import React, { ReactNode } from "react";
// Importamos el componente de navegación correcto
import ClientNavbarWrapper from "@/components/layout/ClientNavbarWrapper";

// Este layout es responsable de dibujar el marco del dashboard
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    // El AuthProvider y ThemeProvider ya vienen del layout raíz
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
      {/* Usamos el ClientNavbarWrapper en lugar del DashboardHeader */}
      <ClientNavbarWrapper />
      <main className="flex-grow p-4 sm:p-6 lg:p-8">
        {children}
      </main>
      {/* Intencionadamente no hay Footer en el dashboard */}
    </div>
  );
}
