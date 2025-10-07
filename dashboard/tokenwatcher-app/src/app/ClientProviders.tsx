// src/app/ClientProviders.tsx
"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

// ESTE ARCHIVO AHORA SOLO CONTIENE PROVIDERS. NO HAY NAVBAR NI FOOTER.
export default function ClientProviders({ children }: { children: ReactNode }) {
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