// src/app/ClientProviders.tsx
"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "next-themes";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Dentro de <ThemeProvider> podemos leer useTheme() para saber isDark / toggleDark.
 * Luego renderizamos Navbar + contenido público + Footer. 
 */
function ClientNavbarAndFooter({ children }: { children: ReactNode }) {
  const { theme, setTheme, systemTheme } = useTheme();
  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <>
      <Navbar isDark={isDark} toggleDark={toggleDark} />
      {/* Quitamos el pt-16 aquí para que el contenido no tenga ese gran espacio */}
      {children}
      <Footer />
    </>
  );
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ClientNavbarAndFooter>{children}</ClientNavbarAndFooter>
      </AuthProvider>
    </ThemeProvider>
  );
}
