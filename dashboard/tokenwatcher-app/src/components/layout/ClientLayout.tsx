// ─── src/components/layout/ClientLayout.tsx ─────────────────────────────────────
"use client";

import { useEffect, useState, ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Simple example: default to dark. You can add a button to toggle `dark` class.
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // On mount, ensure <html> has the correct class
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <>
      <Navbar toggleDark={() => setIsDark((prev) => !prev)} isDark={isDark} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
