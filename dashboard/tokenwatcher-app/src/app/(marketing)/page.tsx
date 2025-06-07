// File: src/app/(marketing)/page.tsx
"use client";

import React, { useEffect } from "react";
import { useTheme } from "next-themes";

import HeroSection from "@/components/home/HeroSection";
import UserBenefitsSection from "@/components/home/UserBenefitsSection";
import FeaturesSection from '@/components/home/FeaturesSection';
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FAQSection from "@/components/home/FAQSection";

export default function HomePage() {
  // ... (tu código de useEffect y useTheme se mantiene igual)

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
        <HeroSection isDark={isDark} toggleDark={toggleDark} />

        {/* === RE-ACTIVAMOS UserBenefitsSection === */}
        <UserBenefitsSection isDark={isDark} />
        
        {/* Los demás siguen comentados para la prueba */}
        {/* <FeaturesSection /> */}
        {/* <HowItWorksSection /> */}
        {/* <FAQSection isDark={isDark} /> */}
        
      </main>
    </div>
  );
}