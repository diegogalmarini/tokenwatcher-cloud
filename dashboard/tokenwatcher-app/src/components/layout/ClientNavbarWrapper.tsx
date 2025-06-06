// ─── src/components/layout/ClientNavbarWrapper.tsx ─────────────────────────────────

"use client";

import React from "react";
import { useTheme } from "next-themes";
import Navbar from "./Navbar";

/**
 * ClientNavbarWrapper
 * ─────────────────────────────────────────────────────────────────────────────
 * Este componente **solo** corre en el cliente (por eso lleva "use client" al inicio).
 * En él usamos useTheme() para controlar el tema oscuro/claro y pasárselo al <Navbar />.
 */
export default function ClientNavbarWrapper() {
  const { theme, setTheme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return <Navbar isDark={isDark} toggleDark={toggleDark} />;
}
