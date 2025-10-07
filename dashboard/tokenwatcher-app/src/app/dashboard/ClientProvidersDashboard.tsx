// src/app/ClientProviders.tsx
"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";

// ESTE ARCHIVO SOLO DEBE CONTENER PROVIDERS DE CONTEXTO
// NO DEBE RENDERIZAR NAVBAR, FOOTER, NI NINGÚN DIV DE LAYOUT
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}