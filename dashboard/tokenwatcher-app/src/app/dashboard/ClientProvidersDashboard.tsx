// src/app/dashboard/ClientProvidersDashboard.tsx
"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import DashboardHeader from "@/components/layout/DashboardHeader";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProvidersDashboard({
  children,
}: ClientProvidersProps) {
  return (
    // ThemeProvider y AuthProvider en cáscara
    <ThemeProvider attribute="class" defaultTheme="system">
      <AuthProvider>
        {/* Este es tu header que muestra el logo, "Hello, usuario" y el toggle */}
        <DashboardHeader />

        {/* Aquí va el contenido real del dashboard (WatcherList + EventList) */}
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
