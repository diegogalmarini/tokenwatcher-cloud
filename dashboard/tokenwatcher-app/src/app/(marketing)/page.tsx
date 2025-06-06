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
        isDark ? "bg-[#121212]" : "bg-[#e8e8e8]" // Color de fondo base de la página
      }`}
    >
      <main className="flex-grow">
        {/* Orden de las secciones de la Home Page:
          1. HeroSection: Introduce el producto.
          2. UserBenefitsSection: Explica el "por qué", el problema que resuelve y para quién.
          3. FeaturesSection: Detalla las características clave.
          4. HowItWorksSection: Muestra cómo empezar a usarlo.
          5. FAQSection: Responde preguntas comunes.
        */}

        <HeroSection isDark={isDark} toggleDark={toggleDark} />

        {/* UserBenefitsSection ahora incluye la introducción del "Por qué TokenWatcher?" 
          y los beneficios detallados por perfil de usuario.
          Se le pasa 'isDark' para que su fondo de sección se ajuste al tema.
        */}
        <UserBenefitsSection isDark={isDark} />

        {/* FeaturesSection es el componente que define las 6 características clave.
          Maneja su propio color de fondo de sección internamente con prefijos dark: de Tailwind.
        */}
        <FeaturesSection />

        {/* HowItWorksSection es el componente que explica los pasos.
          Maneja su propio color de fondo de sección internamente y tiene un estilo distintivo.
        */}
        <HowItWorksSection />

        {/* FAQSection para las preguntas frecuentes.
          Se le pasa 'isDark' para que su fondo y texto se ajusten al tema.
        */}
        <FAQSection isDark={isDark} />
      </main>
    </div>
  );
}