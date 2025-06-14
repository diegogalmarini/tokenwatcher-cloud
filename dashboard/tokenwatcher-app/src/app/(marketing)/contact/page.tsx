// src/app/(marketing)/contact/page.tsx
"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import ContactForm from '@/components/home/ContactForm'; // Importaremos el formulario que crearemos a continuación

export default function ContactPage() {
  const { theme, systemTheme } = useTheme();
  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
      <main className="flex-grow">
        <section className={`py-20 text-center ${isDark ? "bg-[#262626] text-white" : "bg-[#e8e8e8] text-gray-900"}`}>
          <div className="max-w-4xl mx-auto px-6">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Contact Us
            </h1>
            <p className={`text-lg md:text-xl ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Have a question, suggestion, or need support? We'd love to hear from you.
            </p>
          </div>
        </section>

        {/* Aquí renderizaremos nuestro componente de formulario */}
        <section className={`py-16 ${isDark ? "bg-[#121212]" : "bg-[#e8e8e8]"}`}>
            <ContactForm />
        </section>
      </main>
    </div>
  );
}