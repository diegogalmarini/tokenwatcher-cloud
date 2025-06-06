// File: src/app/(marketing)/layout.tsx
"use client";

import React, { ReactNode } from "react";
import ClientProviders from "../ClientProviders";

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  /*
    Ya no ponemos ningún <div className="pt-16"> aquí: 
    el header es sticky o fixed y cada sección se encarga
    de su propio padding/margin.
  */
  return <ClientProviders>{children}</ClientProviders>;
}
