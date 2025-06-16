// src/app/ClientProviders.tsx
"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

// La única responsabilidad de este archivo es proveer contexto.
// NO debe renderizar Navbar, Footer, ni ningún div de layout.
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}