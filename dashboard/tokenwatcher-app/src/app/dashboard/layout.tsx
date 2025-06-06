// src/app/dashboard/layout.tsx
"use client"; // Necesario porque usas handle de theme, auth, etc.

import React, { ReactNode } from "react";
import ClientProvidersDashboard from "./ClientProvidersDashboard";
/*
  ClientProvidersDashboard internamente se encarga de:
    - ThemeProvider (next-themes)
    - AuthProvider
    - Mostrar el DashboardHeader (logo + usuario + toggle)
    - renderizar {children}
*/

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // ClientProvidersDashboard ya engloba a DashboardHeader y AuthProvider
    <ClientProvidersDashboard>
      {children}
    </ClientProvidersDashboard>
  );
}
