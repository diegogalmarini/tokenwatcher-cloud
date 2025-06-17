// src/app/(marketing)/layout.tsx
"use client";

import React, { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Este layout AHORA es el responsable de añadir el Navbar y Footer
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#e8e8e8] dark:bg-[#262626]">
        <Navbar />
        <main className="flex-grow">
            {children}
        </main>
        <Footer />
    </div>
  );
}