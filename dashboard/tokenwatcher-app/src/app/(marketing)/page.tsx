// File: src/app/(marketing)/page.tsx
"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";

// Componentes de sección importados
import HeroSection from "@/components/home/HeroSection";
import UserBenefitsSection from "@/components/home/UserBenefitsSection";
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FAQSection from "@/components/home/FAQSection";

export default function HomePage() {
  // Listener para abrir modal de registro (desde HeroSection)
  useEffect(() => {
    function openRegisterListener() {
      const btn = document.querySelector<HTMLButtonElement>(
        "button[aria-label='open-register']"
      );
      btn?.click();
    }
    window.addEventListener("open-register-modal", openRegisterListener);
    return () => {
      window.removeEventListener("open-register-modal", openRegisterListener);
    };
  }, []);

  // Lógica para el tema oscuro/claro
  const { theme, setTheme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");
  const toggleDark = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"
      }`}
    >
      <main className="flex-grow">
        {/* ================================================================== */}
        {/* PASO DE DEPURACIÓN: Dejamos solo HeroSection para aislar el error */}
        {/* ================================================================== */}

        <HeroSection isDark={isDark} toggleDark={toggleDark} />

        {/* Las siguientes secciones están comentadas temporalmente */}
        
        {/* <UserBenefitsSection isDark={isDark} /> */}
        
        {/* <FeaturesSection /> */}

        {/* <HowItWorksSection /> */}

        {/* <FAQSection isDark={isDark} /> */}
        
      </main>
    </div>
  );
}